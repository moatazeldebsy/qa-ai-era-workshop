import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon, CouponError } from '../../../app/src/coupons.js';

const MAY = new Date('2026-05-15T12:00:00+02:00');
const ok = (code, subtotal, now, discount, expectedCode) =>
  assert.deepEqual(applyCoupon(code, { subtotal, now }), { code: expectedCode, discount });
const rejected = (code, subtotal, now, message) =>
  assert.throws(() => applyCoupon(code, { subtotal, now }), (e) => e instanceof CouponError && message.test(e.message));

test('WELCOME5: 5 EUR off from a 20 EUR subtotal', () => {
  ok('WELCOME5', 20, MAY, 5, 'WELCOME5');
  ok('WELCOME5', 64.5, MAY, 5, 'WELCOME5');
  rejected('WELCOME5', 19.99, MAY, /minimum/i);
});

test('BOOKS10: 10% off, rounded to the cent (halves up), at most 15 EUR', () => {
  ok('BOOKS10', 31.25, MAY, 3.13, 'BOOKS10');
  ok('BOOKS10', 59.98, MAY, 6, 'BOOKS10');
  ok('BOOKS10', 150, MAY, 15, 'BOOKS10');
  ok('BOOKS10', 400, MAY, 15, 'BOOKS10');
});

test('SUMMER26: 20% off from 1 June to 31 August 2026 inclusive, Berlin time', () => {
  ok('SUMMER26', 50, new Date('2026-06-01T00:00:00+02:00'), 10, 'SUMMER26');
  ok('SUMMER26', 50, new Date('2026-08-31T23:59:00+02:00'), 10, 'SUMMER26');
  rejected('SUMMER26', 50, new Date('2026-05-31T23:59:00+02:00'), /not valid/i);
  rejected('SUMMER26', 50, new Date('2026-08-31T22:30:00Z'), /not valid/i); // 1 September, 00:30 in Berlin
});

test('codes ignore case and surrounding spaces, and come back in capitals', () => {
  ok('  books10 ', 59.98, MAY, 6, 'BOOKS10');
});

test('unknown codes are rejected', () => {
  rejected('FREEBOOKS', 50, MAY, /unknown/i);
  rejected('', 50, MAY, /unknown/i);
});

test('a tiny discount rounds to zero cents', () => {
  ok('SUMMER26', 0.01, new Date('2026-07-01T12:00:00+02:00'), 0, 'SUMMER26');
});
