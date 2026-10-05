import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createApp } from '../../../app/src/server.js';
import { serve, get, post, deadUrl } from '../../04-integration-contract/tests/helpers.js';

// Learning Path, Topic 10 — can we tell, from the outside, what the shop is
// doing in production? These tests check the telemetry, not the features.

process.env.LOG_REQUESTS = 'false';

// A stand-in inventory service that records what the shop sent it.
async function recordingInventory() {
  const seen = [];
  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.post('/reservations', (req, res) => {
    seen.push({ requestId: req.get('x-request-id') });
    res.status(201).json({ reservationId: 'res-1', id: 'res-1', lines: req.body.lines, expiresAt: new Date().toISOString() });
  });
  return { ...(await serve(app)), seen };
}

const placeOrder = (url, headers = {}) =>
  fetch(`${url}/api/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ items: [{ bookId: 1, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: 'obs@example.com' } }),
  });

describe('logs and correlation', () => {
  test('every response carries a request id, echoing one the caller sent', async () => {
    const shop = await serve(createApp());
    const res = await fetch(`${shop.url}/api/books`, { headers: { 'x-request-id': 'trace-123' } });
    await shop.close();
    assert.equal(res.headers.get('x-request-id'), 'trace-123');
  });

  // Found while debugging a failed order across two services' logs: the
  // shop's log line had an id, the inventory service's didn't, and nothing
  // joined them.
  test(
    'the request id travels from the shop to the inventory service',
    async () => {
      const inventory = await recordingInventory();
      const shop = await serve(createApp({ inventoryUrl: inventory.url }));
      const res = await placeOrder(shop.url, { 'x-request-id': 'order-trace-42' });
      await shop.close();
      await inventory.close();
      assert.equal(res.status, 201);
      assert.equal(inventory.seen[0]?.requestId, 'order-trace-42');
    },
  );
});

describe('health', () => {
  let shop;
  before(async () => (shop = await serve(createApp({ inventoryUrl: await deadUrl() }))));
  after(() => shop.close());

  test('liveness: /health says the process is up', async () => {
    assert.equal((await get(`${shop.url}/health`)).status, 200);
  });

  // Found during an incident: every order failed (the inventory service was
  // down), yet the shop's health check stayed green, so the load balancer
  // kept sending customers to it and the dashboard said "all fine".
  test(
    'readiness: /ready says the shop cannot take orders while the inventory service is down',
    async () => {
      const ready = await get(`${shop.url}/ready`);
      assert.equal(ready.status, 503);
      assert.equal((await post(`${shop.url}/api/orders`, {})).status === 404, false, 'orders route exists');
    },
  );
});

describe('metrics', () => {
  test('/metrics speaks the Prometheus text format', async () => {
    const shop = await serve(createApp());
    await fetch(`${shop.url}/api/books`);
    const text = await (await fetch(`${shop.url}/metrics`)).text();
    await shop.close();
    assert.match(text, /# TYPE http_requests_total counter/);
    // The counters live at module level, shared by every app in this process,
    // so other tests' requests count too: check the shape, not the number.
    assert.match(text, /http_requests_total\{method="GET",route="\/api\/books",status="200"\} \d+/);
  });

  // Found when the team tried to write a latency SLO: counters say how MANY
  // requests there were, not how LONG they took. Without a histogram there's
  // no way to say "99% of requests under 300 ms".
  test(
    '/metrics has a latency histogram per route',
    async () => {
      const shop = await serve(createApp());
      for (let i = 1; i <= 5; i++) await fetch(`${shop.url}/api/books/${i}`); // a route no other test here uses
      const text = await (await fetch(`${shop.url}/metrics`)).text();
      await shop.close();
      assert.match(text, /# TYPE http_request_duration_seconds histogram/);
      assert.match(text, /http_request_duration_seconds_bucket\{method="GET",route="\/api\/books\/:id",le="0\.25"\} 5/);
      assert.match(text, /http_request_duration_seconds_bucket\{method="GET",route="\/api\/books\/:id",le="\+Inf"\} 5/);
      assert.match(text, /http_request_duration_seconds_count\{method="GET",route="\/api\/books\/:id"\} 5/);
    },
  );
});
