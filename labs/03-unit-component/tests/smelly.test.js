import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceCart } from '../../../app/src/cart.js';
import { next } from '../../../app/src/orders.js';

// Learning Path, Topic 3, lab step 1 — a file full of test smells.
//
// Every test here passes. Every test here is also a problem waiting to
// happen. Find the smells, name them, and rewrite two of the tests in
// labs/03-unit-component/tests/clean.test.js. Don't fix this file: it's the
// "before" picture.

let cart = [{ bookId: 1, quantity: 1 }];

test('test1', () => {
  const r = priceCart(cart);
  assert.ok(r);
  cart.push({ bookId: 3, quantity: 1 });
});

test('cart works', () => {
  const r = priceCart(cart);
  assert.equal(r.total, 63.99);
  const r2 = priceCart([{ bookId: 5, quantity: 3 }]);
  assert.equal(r2.shipping, 0);
  try {
    priceCart([{ bookId: 2, quantity: 1 }]);
  } catch (e) {
    assert.ok(e.message.includes('stock'));
  }
});

test('shipping', () => {
  for (const q of [1, 2]) {
    const r = priceCart([{ bookId: 1, quantity: q }]);
    if (q === 1) assert.equal(r.shipping, 4.9);
    else assert.equal(r.shipping, 0);
  }
});

test('orders', () => {
  const s = next(next(next('placed', 'pay'), 'ship'), 'deliver');
  assert.equal(s.length, 9);
});

test('new year', () => {
  assert.ok(new Date().getFullYear() >= 2026);
});
