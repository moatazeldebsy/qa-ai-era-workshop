import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { createInventoryApp } from '../../../services/inventory/src/app.js';
import { createChaosProxy } from '../chaos-proxy.mjs';
import { serve, get, post } from '../../04-integration-contract/tests/helpers.js';

process.env.LOG_REQUESTS = 'false';
let inventory;
let proxy;
let shop;
before(async () => {
  inventory = await serve(createInventoryApp());
  proxy = await createChaosProxy({ target: inventory.url });
  shop = await serve(createApp({ inventoryUrl: proxy.url }));
});
after(async () => {
  await shop.close();
  await proxy.close();
  await inventory.close();
});
beforeEach(() => proxy.set({ latencyMs: 0, failureRate: 0 }));

const order = async () => {
  const start = performance.now();
  const res = await post(`${shop.url}/api/orders`, { items: [{ bookId: 6, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: 'acc@example.com' } });
  return { ...res, ms: performance.now() - start };
};

test('a very slow inventory service (2 s) gets a fast 503', async () => {
  proxy.set({ latencyMs: 2000 });
  const { status, ms } = await order();
  assert.equal(status, 503);
  assert.ok(ms < 1500, `took ${Math.round(ms)} ms`);
});

test('a slightly slow inventory service (300 ms) still works: the timeout is not too eager', async () => {
  proxy.set({ latencyMs: 300 });
  assert.equal((await order()).status, 201);
});

test('scanner traffic does not grow the metrics, and real routes keep their labels', async () => {
  const lines = async () => (await (await fetch(`${shop.url}/metrics`)).text()).split('\n').filter((l) => l.startsWith('http_requests_total{'));
  await get(`${shop.url}/api/books/3`);
  await lines();
  const before = (await lines()).length;
  for (let i = 0; i < 100; i++) await fetch(`${shop.url}/.env.${i}`, { method: i % 2 ? 'GET' : 'POST' });
  const after = await lines();
  assert.ok(after.length - before <= 2, `${after.length - before} new series from 100 unknown URLs`);
  assert.ok(after.some((l) => l.includes('route="/api/books/:id"')), 'the books route lost its label');
});
