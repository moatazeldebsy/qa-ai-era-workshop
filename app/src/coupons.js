// Coupons. Not written yet: you build this module test-first in the Topic 3
// lab (step 4). The rules are in docs/topics/03-unit-component/lab.md.
//
//   applyCoupon(code, { subtotal, now }) → { code, discount }
//   throws CouponError when the coupon can't be used

export class CouponError extends Error {}

export function applyCoupon() {
  throw new Error('applyCoupon is not implemented yet: build it test-first in the Topic 3 lab, step 4');
}
