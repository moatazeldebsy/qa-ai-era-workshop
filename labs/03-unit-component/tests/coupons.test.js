import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon, CouponError } from '../../../app/src/coupons.js';

// Built test-first, one rule at a time (Topic 3, lab step 4).

const MAY = new Date('2026-05-15T12:00:00+02:00');
const rejects = (code, opts, pattern) =>
  assert.throws(() => applyCoupon(code, opts), (e) => e instanceof CouponError && pattern.test(e.message));

describe('WELCOME5', () => {
  test('takes 5 EUR off an order of at least 20 EUR', () => {
    assert.deepEqual(applyCoupon('WELCOME5', { subtotal: 25, now: MAY }), { code: 'WELCOME5', discount: 5 });
  });
  test('works at exactly 20 EUR', () => {
    assert.equal(applyCoupon('WELCOME5', { subtotal: 20, now: MAY }).discount, 5);
  });
  test('is rejected below 20 EUR', () => rejects('WELCOME5', { subtotal: 19.99, now: MAY }, /minimum/));
});

describe('BOOKS10', () => {
  test('takes 10% off', () => assert.equal(applyCoupon('BOOKS10', { subtotal: 59.98, now: MAY }).discount, 6));
  test('rounds half a cent up', () => assert.equal(applyCoupon('BOOKS10', { subtotal: 31.25, now: MAY }).discount, 3.13));
  test('never takes more than 15 EUR off', () => assert.equal(applyCoupon('BOOKS10', { subtotal: 400, now: MAY }).discount, 15));
});

describe('SUMMER26', () => {
  test('takes 20% off on the first day, 1 June', () => {
    assert.equal(applyCoupon('SUMMER26', { subtotal: 50, now: new Date('2026-06-01T00:00:00+02:00') }).discount, 10);
  });
  test('still works on the last day, 31 August', () => {
    assert.equal(applyCoupon('SUMMER26', { subtotal: 50, now: new Date('2026-08-31T23:59:00+02:00') }).discount, 10);
  });
  test('is rejected the day before it starts', () => {
    rejects('SUMMER26', { subtotal: 50, now: new Date('2026-05-31T23:59:00+02:00') }, /not valid/);
  });
  test('is rejected once it is 1 September in Berlin, even if it is still 31 August in UTC', () => {
    rejects('SUMMER26', { subtotal: 50, now: new Date('2026-08-31T22:30:00Z') }, /not valid/);
  });
});

describe('any code', () => {
  test('ignores case and surrounding spaces, and comes back in capitals', () => {
    assert.deepEqual(applyCoupon('  books10 ', { subtotal: 59.98, now: MAY }), { code: 'BOOKS10', discount: 6 });
  });
  test('an unknown code is rejected', () => rejects('FREEBOOKS', { subtotal: 50, now: MAY }, /unknown/));
  test('an empty code is rejected', () => rejects('', { subtotal: 50, now: MAY }, /unknown/));
});
