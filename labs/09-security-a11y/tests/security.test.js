import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { createInventoryApp } from '../../../services/inventory/src/app.js';
import { serve } from '../../04-integration-contract/tests/helpers.js';

// Learning Path, Topic 9 — security tests you can run on every commit:
// HTTP hardening, abuse cases, and switches that must stay off.

process.env.LOG_REQUESTS = 'false';

describe('the shop over HTTP', () => {
  let shop;
  before(async () => (shop = await serve(createApp())));
  after(() => shop.close());

  test('API errors are JSON, without stack traces or internals', async () => {
    const res = await fetch(`${shop.url}/api/books/42`);
    assert.match(res.headers.get('content-type'), /application\/json/);
    const text = await res.text();
    assert.doesNotMatch(text, /at \w+ \(|node_modules|\.js:\d+/);
  });

  // Found with `curl -I`: the shop announces its framework and sets none of
  // the headers that tell browsers to block sniffing, framing and injection.
  test(
    'responses carry the standard security headers, and hide the framework',
    { todo: 'real gap: no security headers, X-Powered-By: Express; Topic 9 lab, step 2' },
    async () => {
      for (const path of ['/', '/api/books']) {
        const h = (await fetch(`${shop.url}${path}`)).headers;
        assert.equal(h.get('x-powered-by'), null, `${path}: framework announced`);
        assert.equal(h.get('x-content-type-options'), 'nosniff', path);
        assert.match(h.get('content-security-policy') ?? '', /default-src 'self'/, path);
        assert.match(h.get('content-security-policy') ?? '', /frame-ancestors 'none'/, path);
        assert.ok(h.get('referrer-policy'), `${path}: no Referrer-Policy`);
      }
    },
  );
});

describe('the inventory service, an internal API', () => {
  test('the test-data API is off unless explicitly switched on', async () => {
    const inv = await serve(createInventoryApp());
    const res = await fetch(`${inv.url}/stock/1`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{"available":0}' });
    await inv.close();
    assert.equal(res.status, 404);
  });

  // Abuse case: "as an attacker, I hold every copy of every book, so real
  // customers see everything sold out". The inventory service is internal,
  // but compose.yaml publishes its port, and it trusts any caller.
  test(
    'only the shop may reserve stock: callers without the service token are refused',
    { todo: 'real gap: the internal inventory API has no authentication; Topic 9 lab, step 3' },
    async () => {
      const inv = await serve(createInventoryApp({ token: 'shop-secret' }));
      const hoard = await fetch(`${inv.url}/reservations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lines: [{ bookId: 1, quantity: 12 }] }),
      });
      await inv.close();
      assert.equal(hoard.status, 401);
    },
  );
});
