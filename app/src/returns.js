import { refundDecision } from './orders.js';

// Refund claims against delivered orders. The policy itself lives in
// refundDecision() (orders.js); this module works out how long ago an order
// was delivered, which means it depends on the current time.
//
// The clock is injected (`clock: () => Date`), so a test can say "it is now
// 1 June 2026, 00:10 in Berlin" instead of waiting for that moment.

export const SHOP_TIME_ZONE = 'Europe/Berlin';
const DAY_MS = 24 * 60 * 60 * 1000;

// The calendar date of an instant in the shop's time zone, as a UTC midnight
// timestamp, so two dates can be subtracted without DST getting in the way.
const shopDate = (instant) => {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(instant)
    .split('-')
    .map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Calendar days since delivery in the shop's time zone, as the returns policy counts them. */
export function daysSinceDelivery(deliveredAt, now) {
  return Math.round((shopDate(now) - shopDate(deliveredAt)) / DAY_MS);
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
