import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createCheckout, CheckoutError } from '../../../app/src/checkout.js';

// Learning Path, Topic 3 — test doubles.
//
// The checkout talks to three outside systems. Each test replaces them with
// the simplest double that does the job:
//   FAKE   a working, in-memory implementation (the inventory below)
//   STUB   returns canned answers (a payment gateway that approves or declines)
//   SPY    records how it was called, so the test can check afterwards (mock.fn)
// The pricing rules are real: they are ours, fast and deterministic.

function fakeInventory(stock = { 1: 12, 3: 5, 5: 3 }) {
  const reserved = new Map();
  let next = 1;
  return {
    reserved,
    async reserve(lines) {
      for (const { bookId, quantity } of lines) {
        if ((stock[bookId] ?? 0) < quantity) throw new Error(`not enough of book ${bookId}`);
      }
      for (const { bookId, quantity } of lines) stock[bookId] -= quantity;
      const id = `res-${next++}`;
      reserved.set(id, lines);
      return id;
    },
    async release(id) {
      for (const { bookId, quantity } of reserved.get(id) ?? []) stock[bookId] += quantity;
      reserved.delete(id);
    },
  };
}

const approvingPayments = () => ({ charge: mock.fn(async () => ({ id: 'pay-1' })) });
const decliningPayments = () => ({
  charge: mock.fn(async () => {
    throw new Error('card declined');
  }),
});
const spyMailer = () => ({ send: mock.fn(async () => {}) });

function setup({ payments = approvingPayments(), inventory = fakeInventory(), mailer = spyMailer() } = {}) {
  const checkout = createCheckout({
    inventory,
    payments,
    mailer,
    clock: () => new Date('2026-05-01T10:00:00Z'),
    newId: () => 'order-1',
  });
  return { checkout, inventory, payments, mailer };
}

const order = { items: [{ bookId: 1, quantity: 2 }], customer: { email: 'ada@example.com' }, paymentToken: 'tok_visa' };

describe('placing an order', () => {
  test('charges the priced total, in EUR, with the customer token', async () => {
    const { checkout, payments } = setup();
    await checkout.placeOrder(order);
    assert.equal(payments.charge.mock.callCount(), 1);
    assert.deepEqual(payments.charge.mock.calls[0].arguments[0], { amount: 59.98, currency: 'EUR', token: 'tok_visa' });
  });

  test('returns a paid order with a stable id and timestamp', async () => {
    const { checkout } = setup();
    const placed = await checkout.placeOrder(order);
    assert.equal(placed.id, 'order-1');
    assert.equal(placed.state, 'paid');
    assert.equal(placed.placedAt, '2026-05-01T10:00:00.000Z');
    assert.equal(placed.total, 59.98);
  });

  test('sends one confirmation to the customer, with the total', async () => {
    const { checkout, mailer } = setup();
    await checkout.placeOrder(order);
    assert.equal(mailer.send.mock.callCount(), 1);
    const mail = mailer.send.mock.calls[0].arguments[0];
    assert.equal(mail.to, 'ada@example.com');
    assert.match(mail.body, /59\.98 EUR/);
  });

  test('keeps the stock reserved for a paid order', async () => {
    const { checkout, inventory } = setup();
    await checkout.placeOrder(order);
    assert.equal(inventory.reserved.size, 1);
  });
});

describe('when the payment is declined', () => {
  test('fails with a CheckoutError and sends no confirmation', async () => {
    const { checkout, mailer } = setup({ payments: decliningPayments() });
    await assert.rejects(checkout.placeOrder(order), CheckoutError);
    assert.equal(mailer.send.mock.callCount(), 0);
  });

  test(
    'gives the reserved stock back',
    { todo: 'real bug: the reservation leaks when a payment fails; Topic 3 lab, step 3' },
    async () => {
      const { checkout, inventory } = setup({ payments: decliningPayments() });
      await assert.rejects(checkout.placeOrder(order), CheckoutError);
      assert.equal(inventory.reserved.size, 0, 'stock is still reserved for an order that was never paid');
    },
  );
});
