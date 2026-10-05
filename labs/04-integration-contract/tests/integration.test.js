import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { createInventoryApp } from '../../../services/inventory/src/app.js';
import { serve, get, post } from './helpers.js';

// Learning Path, Topic 4 — integration tests.
//
// Two real services, wired together over real HTTP: the shop, and the
// inventory service it calls. No doubles. These tests answer the question
// Topic 3's fake inventory couldn't: does the shop's client actually speak
// the inventory service's language?

process.env.LOG_REQUESTS = 'false';
const inventoryApp = createInventoryApp();
let inventory;
let shop;

before(async () => {
  inventory = await serve(inventoryApp);
  shop = await serve(createApp({ inventoryUrl: inventory.url }));
});
after(async () => {
  await shop.close();
  await inventory.close();
});
beforeEach(() => inventoryApp.locals.reset());

const stockOf = async (bookId) => (await get(`${inventory.url}/stock/${bookId}`)).body.available;
const placeOrder = (items, paymentToken = 'tok_visa') =>
  post(`${shop.url}/api/orders`, { items, paymentToken, customer: { email: 'ada@example.com' } });

describe('shop → inventory', () => {
  test('placing an order holds the stock in the inventory service', async () => {
    const { status, body } = await placeOrder([{ bookId: 1, quantity: 2 }]);
    assert.equal(status, 201);
    assert.equal(body.state, 'paid');
    assert.equal(await stockOf(1), 10);
  });

  test('ordering more than the inventory service holds is a 409', async () => {
    const { status, body } = await placeOrder([{ bookId: 5, quantity: 3 }, { bookId: 3, quantity: 5 }]);
    assert.equal(status, 201, JSON.stringify(body));
    const again = await placeOrder([{ bookId: 5, quantity: 1 }]);
    assert.equal(again.status, 409);
    assert.match(again.body.error, /book 5/);
  });

  test('a cancelled order can be fetched with its new state', async () => {
    const placed = await placeOrder([{ bookId: 4, quantity: 1 }]);
    const cancel = await post(`${shop.url}/api/orders/${placed.body.id}/cancel`, {});
    assert.equal(cancel.status, 200);
    assert.equal((await get(`${shop.url}/api/orders/${placed.body.id}`)).body.state, 'cancelled');
  });

  // Found by checking the OTHER service's state, not just the shop's answer.
  // The shop says "cancelled", but the inventory service never got the stock
  // back. Every test with a fake inventory passed; only the real one shows it.
  test(
    'cancelling an order gives its stock back to the inventory service',
    { todo: 'real bug: the shop and the inventory service disagree about the reservation; Topic 4 lab, step 2' },
    async () => {
      const placed = await placeOrder([{ bookId: 1, quantity: 2 }]);
      assert.equal(await stockOf(1), 10);
      await post(`${shop.url}/api/orders/${placed.body.id}/cancel`, {});
      assert.equal(await stockOf(1), 12);
    },
  );
});
