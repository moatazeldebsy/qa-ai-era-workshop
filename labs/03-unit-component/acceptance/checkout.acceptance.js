import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, CheckoutError } from '../../../app/src/checkout.js';

function inventory() {
  const reserved = new Set();
  return {
    reserved,
    reserve: mock.fn(async () => {
      reserved.add('res-1');
      return 'res-1';
    }),
    release: mock.fn(async (id) => reserved.delete(id)),
  };
}
const order = { items: [{ bookId: 1, quantity: 2 }], customer: { email: 'ada@example.com' }, paymentToken: 'tok' };

test('a declined payment releases the reservation it made', async () => {
  const inv = inventory();
  const checkout = createCheckout({
    inventory: inv,
    payments: { charge: async () => Promise.reject(new Error('declined')) },
    mailer: { send: async () => {} },
  });
  await assert.rejects(checkout.placeOrder(order), CheckoutError);
  assert.equal(inv.release.mock.callCount(), 1);
  assert.equal(inv.release.mock.calls[0].arguments[0], 'res-1');
  assert.equal(inv.reserved.size, 0);
});

test('a failing confirmation email does not fail a paid order', async () => {
  const checkout = createCheckout({
    inventory: inventory(),
    payments: { charge: async () => ({ id: 'pay-1' }) },
    mailer: { send: async () => Promise.reject(new Error('SMTP down')) },
  });
  const placed = await checkout.placeOrder(order);
  assert.equal(placed.state, 'paid');
  assert.equal(placed.confirmationSent, false);
});

test('a successful order records that the confirmation was sent', async () => {
  const checkout = createCheckout({
    inventory: inventory(),
    payments: { charge: async () => ({ id: 'pay-1' }) },
    mailer: { send: async () => {} },
  });
  assert.equal((await checkout.placeOrder(order)).confirmationSent, true);
});
