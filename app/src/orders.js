// Order lifecycle and refund rules. Pure functions, no I/O: the HTTP API for
// orders arrives in a later Learning Path topic, and the rules are tested here
// first (Topic 2: state-transition testing and decision tables).
//
//   placed --pay--> paid --ship--> shipped --deliver--> delivered --refund--> refunded
//      \               \
//       cancel          cancel
//        v               v
//      cancelled       cancelled

export const STATES = ['placed', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
export const EVENTS = ['pay', 'ship', 'deliver', 'cancel', 'refund'];

export const TRANSITIONS = {
  placed: { pay: 'paid', cancel: 'cancelled' },
  paid: { ship: 'shipped', cancel: 'cancelled' },
  shipped: { deliver: 'delivered' },
  delivered: { refund: 'refunded' },
  cancelled: {},
  refunded: {},
};

export const RETURN_WINDOW_DAYS = 30;

export class InvalidTransition extends Error {}

/**
 * The state after `event`, or throws InvalidTransition. A refund also needs a
 * `claim` ({ daysSinceDelivery, originalCondition, arrivedDamaged }) that
 * refundDecision() accepts.
 */
export function next(state, event, claim) {
  if (!STATES.includes(state)) throw new InvalidTransition(`unknown state ${state}`);
  const to = TRANSITIONS[state][event];
  if (!to) throw new InvalidTransition(`cannot ${event} an order that is ${state}`);
  if (event === 'refund') {
    const { refund, reason } = refundDecision(claim);
    if (!refund) throw new InvalidTransition(`refund rejected: ${reason}`);
  }
  return to;
}

/**
 * The returns policy as a decision:
 *   - claims must be made within 30 days of delivery (day 30 is still in time)
 *   - a book that arrived damaged is refunded whatever its condition now
 *   - otherwise the book must be in its original condition
 */
export function refundDecision({ daysSinceDelivery, originalCondition, arrivedDamaged } = {}) {
  if (!Number.isInteger(daysSinceDelivery) || daysSinceDelivery < 0) {
    throw new RangeError('daysSinceDelivery must be a whole number of days, 0 or more');
  }
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) return { refund: false, reason: 'outside the 30-day window' };
  if (arrivedDamaged) return { refund: true, reason: 'arrived damaged' };
  if (!originalCondition) return { refund: false, reason: 'not in original condition' };
  return { refund: true, reason: 'returned in original condition' };
}
