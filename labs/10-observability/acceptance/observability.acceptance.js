import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import express from 'express';
import { createApp } from '../../../app/src/server.js';
import { createInventoryApp } from '../../../services/inventory/src/app.js';
import { createChaosProxy } from '../../08-performance/chaos-proxy.mjs';
import { serve, deadUrl } from '../../04-integration-contract/tests/helpers.js';

process.env.LOG_REQUESTS = 'false';
const order = (url, headers = {}) =>
  fetch(`${url}/api/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ items: [{ bookId: 3, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: 'acc@example.com' } }),
  });

test('a generated request id is the same in the shop response and at the inventory service', async () => {
  const seen = [];
  const fake = express().use(express.json());
  fake.post('/reservations', (req, res) => {
    seen.push(req.get('x-request-id'));
    res.status(201).json({ reservationId: 'r', id: 'r', lines: req.body.lines, expiresAt: new Date().toISOString() });
  });
  const inv = await serve(fake);
  const shop = await serve(createApp({ inventoryUrl: inv.url }));
  const res = await order(shop.url); // no id sent: the shop makes one
  await shop.close();
  await inv.close();
  assert.equal(res.status, 201);
  assert.ok(seen[0], 'the inventory service received no request id');
  assert.equal(seen[0], res.headers.get('x-request-id'));
});

test('readiness follows the inventory service: ready, down, and hanging', async () => {
  const inv = await serve(createInventoryApp());
  const proxy = await createChaosProxy({ target: inv.url });
  const shop = await serve(createApp({ inventoryUrl: proxy.url }));
  try {
    assert.equal((await fetch(`${shop.url}/ready`)).status, 200);
    proxy.set({ failureRate: 1 });
    assert.equal((await fetch(`${shop.url}/ready`)).status, 503);
    proxy.set({ failureRate: 0, latencyMs: 3000 });
    const start = performance.now();
    assert.equal((await fetch(`${shop.url}/ready`)).status, 503);
    assert.ok(performance.now() - start < 1500, 'a readiness check must not hang on a slow dependency');
    assert.equal((await fetch(`${shop.url}/health`)).status, 200, 'liveness stays green');
  } finally {
    await shop.close();
    await proxy.close();
    await inv.close();
  }
});

test('the latency histogram is cumulative and consistent with its count', async () => {
  const shop = await serve(createApp({ inventoryUrl: await deadUrl() }));
  for (let i = 0; i < 7; i++) {
    await fetch(`${shop.url}/api/cart/price`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"items":[{"bookId":1,"quantity":1}]}' });
  }
  const text = await (await fetch(`${shop.url}/metrics`)).text();
  await shop.close();
  const buckets = [...text.matchAll(/http_request_duration_seconds_bucket\{method="POST",route="\/api\/cart\/price",le="([^"]+)"\} (\d+)/g)].map((m) => Number(m[2]));
  assert.ok(buckets.length >= 5, 'expected several buckets for POST /api/cart/price');
  for (let i = 1; i < buckets.length; i++) assert.ok(buckets[i] >= buckets[i - 1], 'buckets must be cumulative');
  assert.equal(buckets.at(-1), 7);
  assert.match(text, /http_request_duration_seconds_count\{method="POST",route="\/api\/cart\/price"\} 7/);
});

test('the synthetic journey passes against healthy services', async () => {
  const inv = await serve(createInventoryApp());
  const shop = await serve(createApp({ inventoryUrl: inv.url }));
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, ['labs/10-observability/synthetic.mjs'], { env: { ...process.env, BASE_URL: shop.url }, stdio: 'ignore' });
    child.on('close', resolve);
  });
  await shop.close();
  await inv.close();
  assert.equal(code, 0);
});
