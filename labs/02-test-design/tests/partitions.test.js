import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { priceCart, shippingFor, ValidationError } from '../../../app/src/cart.js';
import { refundDecision } from '../../../app/src/orders.js';

// Learning Path, Topic 2 — equivalence partitioning and boundary value analysis.
//
// Each input is split into PARTITIONS: groups of values the code should treat
// the same way. One value per partition is enough to cover the partition; the
// bugs live at the edges between partitions, so each edge gets the values on
// both sides of it (two-value BVA) or on, below and above it (three-value BVA).

const ok = (items) => assert.doesNotThrow(() => priceCart(items));
const rejected = (items, message) => assert.throws(() => priceCart(items), (err) => err instanceof ValidationError && message.test(err.message));

describe('quantity: partitions < 1 | 1..10 | > 10 | not an integer', () => {
  // Book 1 has 12 in stock, so the stock rule never interferes here.
  const qty = (quantity) => [{ bookId: 1, quantity }];
  const RANGE = /integer from 1 to 10/;

  test('below the range: 0 and -1 are rejected', () => {
    rejected(qty(0), RANGE);
    rejected(qty(-1), RANGE);
  });
  test('lower boundary: 1 is accepted', () => ok(qty(1)));
  test('inside the range: 5 is accepted (one representative is enough)', () => ok(qty(5)));
  test('upper boundary: 10 is accepted', () => ok(qty(10)));
  test('above the range: 11 is rejected', () => rejected(qty(11), RANGE));
  test('not an integer: 1.5, "2" and null are rejected', () => {
    for (const q of [1.5, '2', null]) rejected(qty(q), RANGE);
  });
});

describe('stock: partitions quantity <= stock | quantity > stock | out of stock', () => {
  // Book 5 has exactly 3 in stock; book 2 has none.
  test('on the boundary: all 3 copies of book 5 are accepted', () => ok([{ bookId: 5, quantity: 3 }]));
  test('just over: 4 copies of book 5 are rejected', () => rejected([{ bookId: 5, quantity: 4 }], /only 3/));
  test('out of stock: 1 copy of book 2 is rejected', () => rejected([{ bookId: 2, quantity: 1 }], /only 0/));
});

describe('book id and items: valid | unknown | wrong shape', () => {
  test('unknown book ids are rejected', () => {
    for (const bookId of [0, 42]) rejected([{ bookId, quantity: 1 }], /unknown book/);
  });
  test('an empty or missing items list is rejected', () => {
    for (const items of [[], undefined, 'not-an-array']) rejected(items, /non-empty array/);
  });
});

describe('shipping: partitions subtotal < 50 | subtotal >= 50', () => {
  // Three-value BVA around the threshold, plus the extremes of each partition.
  for (const [subtotal, fee] of [[0.01, 4.9], [49.99, 4.9], [50, 0], [50.01, 0], [1000, 0]]) {
    test(`${subtotal} EUR → shipping ${fee}`, () => assert.equal(shippingFor(subtotal), fee));
  }
});

describe('refund window: partitions < 0 (invalid) | 0..30 | > 30', () => {
  const claim = (daysSinceDelivery) => ({ daysSinceDelivery, originalCondition: true, arrivedDamaged: false });
  test('day -1 is invalid input', () => assert.throws(() => refundDecision(claim(-1)), RangeError));
  test('day 0 (delivered today) is in time', () => assert.equal(refundDecision(claim(0)).refund, true));
  test('day 30 is still in time ("within 30 days")', () => assert.equal(refundDecision(claim(30)).refund, true));
  test('day 31 is too late', () => assert.equal(refundDecision(claim(31)).refund, false));
});

describe('error guessing: inputs each rule allows alone, but not together', () => {
  // Every partition above is checked one line at a time. Experience says: try
  // the same item twice. Two lines of 2 copies of book 5 (stock 3) sell 4.
  test(
    'the same book on two lines cannot exceed its stock',
    { todo: 'real bug: each line is checked alone; fixed in Topic 2 lab, step 4' },
    () => rejected([{ bookId: 5, quantity: 2 }, { bookId: 5, quantity: 2 }], /more than once|only 3/),
  );
});
