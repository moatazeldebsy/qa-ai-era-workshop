import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { createInventoryApp } from '../../../services/inventory/src/app.js';
import { serve, get, post } from '../tests/helpers.js';

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

test('an order records the reservation id the inventory service issued', async () => {
  const placed = await post(`${shop.url}/api/orders`, { items: [{ bookId: 3, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: 'ada@example.com' } });
  assert.equal(placed.status, 201);
  assert.ok(inventoryApp.locals.reservations().has(placed.body.reservationId), `unknown reservation ${placed.body.reservationId}`);
});

test('cancelling gives the stock back', async () => {
  inventoryApp.locals.reset();
  const placed = await post(`${shop.url}/api/orders`, { items: [{ bookId: 6, quantity: 3 }], paymentToken: 'tok_visa', customer: { email: 'ada@example.com' } });
  assert.equal((await get(`${inventory.url}/stock/6`)).body.available, 4);
  await post(`${shop.url}/api/orders/${placed.body.id}/cancel`, {});
  assert.equal((await get(`${inventory.url}/stock/6`)).body.available, 7);
});
