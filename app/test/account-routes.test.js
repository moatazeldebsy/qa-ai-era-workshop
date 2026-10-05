import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.js';
import { createInventoryApp } from '../../services/inventory/src/app.js';
import { TEST_ACCOUNT } from '../src/accounts.js';

// The account endpoints over HTTP, with a real inventory service in-process,
// so a signed-in customer can place an order and find it in their history.

const listen = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, server }));
  });

let shop, inventory;
before(async () => {
  process.env.LOG_REQUESTS = 'false';
  inventory = await listen(createInventoryApp());
  shop = await listen(createApp({ inventoryUrl: inventory.url }));
});
after(() => {
  shop.server.close();
  inventory.server.close();
});

async function call(method, path, { body, cookie } = {}) {
  const res = await fetch(shop.url + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: res.headers.get('set-cookie') };
}

const sessionOf = (setCookie) => setCookie.split(';')[0];
const order = { items: [{ bookId: 1, quantity: 1 }], paymentToken: 'tok_visa' };
const shipTo = { name: 'Ada Lovelace', street: '12 St James Square', city: 'London', postcode: 'SW1Y 4JH', country: 'UK' };

test('a guest is not signed in', async () => {
  assert.deepEqual((await call('GET', '/api/auth/me')).body, { user: null });
  assert.equal((await call('GET', '/api/account/orders')).status, 401);
});

test('registering sets an HttpOnly, SameSite=Strict session cookie', async () => {
  const res = await call('POST', '/api/auth/register', { body: { name: 'Lin', email: 'lin@example.com', password: 'long-enough' } });
  assert.equal(res.status, 201);
  assert.match(res.setCookie, /^qb_session=[\w-]{43}; HttpOnly; SameSite=Strict; Path=\/; Max-Age=7200$/);
  assert.equal(JSON.stringify(res.body).includes('long-enough'), false, 'password must never be echoed');
  assert.equal((await call('GET', '/api/auth/me', { cookie: sessionOf(res.setCookie) })).body.user.email, 'lin@example.com');
});

test('registration errors: 400 for invalid input, 409 for a taken email', async () => {
  assert.equal((await call('POST', '/api/auth/register', { body: { name: 'X', email: 'x@example.com', password: 'short' } })).status, 400);
  assert.equal((await call('POST', '/api/auth/register', { body: { ...TEST_ACCOUNT } })).status, 409);
});

test('a wrong password is 401 without a cookie', async () => {
  const res = await call('POST', '/api/auth/login', { body: { email: TEST_ACCOUNT.email, password: 'nope-nope' } });
  assert.equal(res.status, 401);
  assert.equal(res.setCookie, null);
});

test('a signed-in order is linked to the customer and listed in their history', async () => {
  const cookie = sessionOf((await call('POST', '/api/auth/login', { body: TEST_ACCOUNT })).setCookie);
  const me = (await call('GET', '/api/auth/me', { cookie })).body.user;

  const placed = await call('POST', '/api/orders', { body: { ...order, shipTo }, cookie });
  assert.equal(placed.status, 201);
  assert.equal(placed.body.userId, me.id);
  assert.deepEqual(placed.body.shipTo, shipTo);

  const guest = await call('POST', '/api/orders', { body: order });
  assert.equal(guest.status, 201);
  assert.equal('userId' in guest.body, false);

  const { orders } = (await call('GET', '/api/account/orders', { cookie })).body;
  assert.equal(orders[0].id, placed.body.id);
  assert.equal(orders.some((o) => o.id === guest.body.id), false, "a guest's order is in nobody's history");
});

test('logging out ends the session', async () => {
  const cookie = sessionOf((await call('POST', '/api/auth/login', { body: TEST_ACCOUNT })).setCookie);
  const res = await call('POST', '/api/auth/logout', { cookie });
  assert.equal(res.status, 204);
  assert.match(res.setCookie, /Max-Age=0/);
  assert.deepEqual((await call('GET', '/api/auth/me', { cookie })).body, { user: null });
});

test('an incomplete shipping address is rejected before anything is charged', async () => {
  const res = await call('POST', '/api/orders', { body: { ...order, shipTo: { ...shipTo, city: ' ' } } });
  assert.equal(res.status, 400);
});

test('the insufficient-funds test token is declined', async () => {
  const res = await call('POST', '/api/orders', { body: { ...order, paymentToken: 'tok_insufficient_funds' } });
  assert.deepEqual([res.status, res.body.error], [402, 'payment failed: insufficient funds']);
});
