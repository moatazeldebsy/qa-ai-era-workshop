import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceCart, ValidationError } from '../../../app/src/cart.js';

// Two tests from smelly.test.js, rewritten: one behaviour each, a name that
// states the rule, everything the test needs visible inside it, and an
// assertion that fails for the right reason.

test('a cart of 29.99 and 34.00 EUR ships free and totals 63.99 EUR', () => {
  const cart = priceCart([
    { bookId: 1, quantity: 1 },
    { bookId: 3, quantity: 1 },
  ]);
  assert.deepEqual([cart.subtotal, cart.shipping, cart.total], [63.99, 0, 63.99]);
});

test('an out-of-stock book is rejected with a stock message', () => {
  assert.throws(() => priceCart([{ bookId: 2, quantity: 1 }]), (err) => err instanceof ValidationError && /only 0/.test(err.message));
});

test('one copy of a 29.99 EUR book pays 4.90 EUR shipping', () => {
  assert.equal(priceCart([{ bookId: 1, quantity: 1 }]).shipping, 4.9);
});

test('two copies of a 29.99 EUR book ship free', () => {
  assert.equal(priceCart([{ bookId: 1, quantity: 2 }]).shipping, 0);
});
