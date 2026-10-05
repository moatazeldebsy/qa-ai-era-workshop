import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { createInventoryApp } from '../../../services/inventory/src/app.js';
import { createChaosProxy } from '../chaos-proxy.mjs';
import { serve, get, post } from '../../04-integration-contract/tests/helpers.js';

// Learning Path, Topic 8 — resilience: what does the shop do when the
// inventory service misbehaves? The chaos proxy sits between them.

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

const order = () => post(`${shop.url}/api/orders`, { items: [{ bookId: 3, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: 'ada@example.com' } });
const timed = async (fn) => {
  const start = performance.now();
  const result = await fn();
  return { ...result, ms: performance.now() - start };
};

describe('when the inventory service misbehaves', () => {
  test('with a healthy network, an order goes through the proxy', async () => {
    assert.equal((await order()).status, 201);
  });

  test('when the inventory service fails, the shop says it is unavailable (503)', async () => {
    proxy.set({ failureRate: 1 });
    const { status, body } = await order();
    assert.equal(status, 503);
    assert.match(body.error, /unavailable/);
  });

  // Found by injecting latency. With no timeout, every order waits as long as
  // the inventory service does; under load, waiting requests pile up until
  // the shop itself falls over. A dependency must never make you wait forever.
  test(
    'when the inventory service is slow, the shop fails fast instead of hanging',
    async () => {
      proxy.set({ latencyMs: 3000 });
      const { status, ms } = await timed(order);
      assert.equal(status, 503);
      assert.ok(ms < 1500, `took ${Math.round(ms)} ms`);
    },
  );
});

describe('under unusual traffic', () => {
  // Found by a soak test that requested many different unknown URLs (bots and
  // scanners do exactly this). Each one became a new metric series, kept in
  // memory forever: a slow memory leak, and a monitoring bill that grows with
  // every scanner that visits.
  test(
    'unknown URLs do not create new metric series',
    async () => {
      const series = async () => (await (await fetch(`${shop.url}/metrics`)).text()).split('\n').filter((l) => l.startsWith('http_requests_total{')).length;
      await series(); // the first /metrics call adds its own series; measure after it
      const before = await series();
      for (let i = 0; i < 50; i++) await get(`${shop.url}/wp-admin/${i}.php`);
      assert.ok((await series()) - before <= 1, `${(await series()) - before} new series from 50 unknown URLs`);
    },
  );
});
