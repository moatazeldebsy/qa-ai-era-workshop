import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceCart, ValidationError } from '../src/cart.js';

// Unit tests: the bottom of the pyramid. Milliseconds to run, no server,
// and they pin the exact rule ("free shipping at a 50 EUR subtotal").

test('charges shipping under the threshold', () => {
  const cart = priceCart([{ bookId: 1, quantity: 1 }], { bugMode: undefined });
  assert.deepEqual([cart.subtotal, cart.shipping, cart.total], [29.99, 4.9, 34.89]);
});

test('free shipping is based on the subtotal, across lines and quantities', () => {
  const cart = priceCart([{ bookId: 1, quantity: 1 }, { bookId: 4, quantity: 1 }], { bugMode: undefined });
  assert.equal(cart.shipping, 0);
});

test('rounds to cents', () => {
  const cart = priceCart([{ bookId: 4, quantity: 3 }], { bugMode: undefined });
  assert.equal(cart.subtotal, 93.75);
});

test('rejects quantities outside 1-10', () => {
  assert.throws(() => priceCart([{ bookId: 1, quantity: 0 }], { bugMode: undefined }), ValidationError);
  assert.throws(() => priceCart([{ bookId: 1, quantity: 11 }], { bugMode: undefined }), ValidationError);
});

// Guards the lab itself: BUG_MODE=cart must stay a real regression, or Topic 6
// has nothing for the quality gate to catch.
test('BUG_MODE=cart still reproduces the shipping regression', () => {
  const buggy = priceCart([{ bookId: 1, quantity: 2 }], { bugMode: 'cart' });
  assert.equal(buggy.shipping, 4.9, 'the regression charges shipping on a 59.98 EUR cart');
});
