// Coupons, built test-first in the Topic 3 lab.
//
//   applyCoupon(code, { subtotal, now }) → { code, discount }
//   throws CouponError when the coupon can't be used

export class CouponError extends Error {}

const SHOP_TIME_ZONE = 'Europe/Berlin';
const cents = (n) => Math.round(n * 100) / 100;
const shopDay = (now) => new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE }).format(now); // "2026-06-01"

const COUPONS = {
  WELCOME5: ({ subtotal }) => {
    if (subtotal < 20) throw new CouponError('WELCOME5 needs a minimum subtotal of 20 EUR');
    return 5;
  },
  BOOKS10: ({ subtotal }) => Math.min(cents(subtotal * 0.1), 15),
  SUMMER26: ({ subtotal, now }) => {
    const day = shopDay(now);
    if (day < '2026-06-01' || day > '2026-08-31') throw new CouponError('SUMMER26 is not valid today');
    return cents(subtotal * 0.2);
  },
};

export function applyCoupon(code, { subtotal, now }) {
  const normalised = String(code ?? '').trim().toUpperCase();
  const rule = COUPONS[normalised];
  if (!rule) throw new CouponError(`unknown coupon ${normalised || '(empty)'}`);
  return { code: normalised, discount: Math.min(rule({ subtotal, now }), subtotal) };
}
