import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { createInventoryApp } from '../../../services/inventory/src/app.js';
import { serve, post } from '../../04-integration-contract/tests/helpers.js';

process.env.LOG_REQUESTS = 'false';

test('every kind of response is hardened: page, script, API, POST and 404', async () => {
  const shop = await serve(createApp());
  try {
    const responses = [
      await fetch(`${shop.url}/`),
      await fetch(`${shop.url}/app.js`),
      await fetch(`${shop.url}/api/books?q=ai`),
      await fetch(`${shop.url}/api/cart/price`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"items":[{"bookId":1,"quantity":1}]}' }),
      await fetch(`${shop.url}/no/such/page`),
    ];
    for (const res of responses) {
      const where = `${res.url} (${res.status})`;
      assert.equal(res.headers.get('x-powered-by'), null, where);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff', where);
      const csp = res.headers.get('content-security-policy') ?? '';
      assert.match(csp, /default-src 'self'/, where);
      assert.match(csp, /frame-ancestors 'none'/, where);
      assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|\*/, `${where}: CSP too loose`);
    }
  } finally {
    await shop.close();
  }
});

test('the inventory service refuses every call without the right token, except /health', async () => {
  const inv = await serve(createInventoryApp({ token: 'acceptance-token' }));
  try {
    const call = (path, method = 'GET', authorization) =>
      fetch(`${inv.url}${path}`, {
        method,
        headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
        body: method === 'POST' ? '{"lines":[{"bookId":1,"quantity":1}]}' : undefined,
      }).then((r) => r.status);
    assert.equal(await call('/health'), 200);
    assert.equal(await call('/stock/1'), 401);
    assert.equal(await call('/reservations', 'POST'), 401);
    assert.equal(await call('/reservations/x', 'DELETE'), 401);
    assert.equal(await call('/reservations', 'POST', 'Bearer wrong-token'), 401);
    assert.equal(await call('/reservations', 'POST', 'Bearer acceptance-token'), 201);
  } finally {
    await inv.close();
  }
});

test('with the token configured on both sides, the shop still takes orders', async () => {
  const inv = await serve(createInventoryApp({ token: 'shared-secret' }));
  const shop = await serve(createApp({ inventoryUrl: inv.url, inventoryToken: 'shared-secret' }));
  try {
    const { status } = await post(`${shop.url}/api/orders`, { items: [{ bookId: 4, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: 'acc@example.com' } });
    assert.equal(status, 201);
  } finally {
    await shop.close();
    await inv.close();
  }
});
