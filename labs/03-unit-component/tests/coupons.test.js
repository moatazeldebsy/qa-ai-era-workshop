import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon, CouponError } from '../../../app/src/coupons.js';

// Learning Path, Topic 3, lab step 4 — build coupons test-first.
//
// Red → green → refactor, one rule at a time:
//   1. write ONE failing test for the next rule
//   2. write just enough code in app/src/coupons.js to make it pass
//   3. tidy up, keep everything green, repeat
// The rules are in the lab page. Start by removing the TODO below.

test('WELCOME5 takes 5 EUR off an order of at least 20 EUR', { todo: 'start here: remove this TODO and make it pass' }, () => {
  const result = applyCoupon('WELCOME5', { subtotal: 25, now: new Date('2026-05-01T12:00:00Z') });
  assert.deepEqual(result, { code: 'WELCOME5', discount: 5 });
});

void CouponError; // you'll need it for the rules that reject a coupon
