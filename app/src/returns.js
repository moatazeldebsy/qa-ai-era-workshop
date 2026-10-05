import { refundDecision } from './orders.js';

// Refund claims against delivered orders. The policy itself lives in
// refundDecision() (orders.js); this module works out how long ago an order
// was delivered, which means it depends on the current time.
//
// The clock is injected (`clock: () => Date`), so a test can say "it is now
// 1 June 2026, 00:10 in Berlin" instead of waiting for that moment.

export const SHOP_TIME_ZONE = 'Europe/Berlin';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Days since delivery, as the returns policy counts them. */
export function daysSinceDelivery(deliveredAt, now) {
  return Math.floor((now.getTime() - deliveredAt.getTime()) / DAY_MS);
}

export function createReturns({ clock = () => new Date() } = {}) {
  return {
    /** Assess a refund claim for an order ({ state, deliveredAt }). */
    assess(order, { originalCondition = true, arrivedDamaged = false } = {}) {
      if (order.state !== 'delivered') return { refund: false, reason: `order is ${order.state}, not delivered` };
      const days = daysSinceDelivery(new Date(order.deliveredAt), clock());
      return { ...refundDecision({ daysSinceDelivery: days, originalCondition, arrivedDamaged }), days };
    },
  };
}
