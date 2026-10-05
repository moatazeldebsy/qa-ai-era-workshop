import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createCheckout } from '../../../app/src/checkout.js';

// Learning Path, Topic 3 — a test that checks HOW, not WHAT.
//
// This test mocks every collaborator and then checks that each one was called
// once. It passes. It also passes with BUG_MODE=cart, which charges customers
// the wrong amount: try it with
//
//   BUG_MODE=cart node --test labs/03-unit-component/tests/interactions.test.js
//
// Your job in lab step 3 is to make it a test that would notice.

test('placeOrder talks to inventory, payments and mailer', async () => {
  const inventory = { reserve: mock.fn(async () => 'res-1'), release: mock.fn(async () => {}) };
  const payments = { charge: mock.fn(async () => ({ id: 'pay-1' })) };
  const mailer = { send: mock.fn(async () => {}) };
  const checkout = createCheckout({ inventory, payments, mailer });

  await checkout.placeOrder({ items: [{ bookId: 1, quantity: 2 }], customer: { email: 'ada@example.com' }, paymentToken: 'tok' });

  assert.equal(inventory.reserve.mock.callCount(), 1);
  assert.equal(payments.charge.mock.callCount(), 1);
  assert.equal(mailer.send.mock.callCount(), 1);
  // What matters to the customer: 2 x 29.99 = 59.98 EUR, free shipping.
  assert.equal(payments.charge.mock.calls[0].arguments[0].amount, 59.98);
});
