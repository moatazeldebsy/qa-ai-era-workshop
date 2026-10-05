import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { next, STATES, EVENTS, TRANSITIONS, InvalidTransition } from '../../../app/src/orders.js';

// Learning Path, Topic 2 — state-transition testing.
//
// The model is the diagram at the top of app/src/orders.js. Three levels of
// coverage, each stronger than the last:
//   - every state visited
//   - every valid transition taken (0-switch coverage)
//   - every pair of consecutive transitions taken (1-switch coverage)
// plus the part most suites forget: every INVALID state/event pair rejected.

const REFUNDABLE = { daysSinceDelivery: 5, originalCondition: true, arrivedDamaged: false };

// The expected model, written out by hand from the requirement. Comparing it
// with the code's table is itself a test: it catches an extra arrow.
const EXPECTED = [
  ['placed', 'pay', 'paid'],
  ['placed', 'cancel', 'cancelled'],
  ['paid', 'ship', 'shipped'],
  ['paid', 'cancel', 'cancelled'],
  ['shipped', 'deliver', 'delivered'],
  ['delivered', 'refund', 'refunded'],
];

describe('valid transitions (0-switch coverage)', () => {
  for (const [from, event, to] of EXPECTED) {
    test(`${from} --${event}--> ${to}`, () => assert.equal(next(from, event, REFUNDABLE), to));
  }
});

describe('invalid transitions: the rest of the state × event table', () => {
  // 6 states × 5 events = 30 cells; 6 are valid, so 24 must be rejected.
  const valid = new Set(EXPECTED.map(([from, event]) => `${from}:${event}`));
  const invalid = STATES.flatMap((s) => EVENTS.map((e) => [s, e])).filter(([s, e]) => !valid.has(`${s}:${e}`));

  test('there are 24 invalid pairs', () => assert.equal(invalid.length, 24));
  for (const [state, event] of invalid) {
    test(`cannot ${event} when ${state}`, () => assert.throws(() => next(state, event, REFUNDABLE), InvalidTransition));
  }
  test('the code has no transitions the requirement does not', () => {
    const actual = Object.entries(TRANSITIONS).flatMap(([from, evs]) => Object.entries(evs).map(([e, to]) => [from, e, to]));
    assert.deepEqual(actual.sort(), [...EXPECTED].sort());
  });
});

describe('sequences (1-switch coverage)', () => {
  const run = (events) => events.reduce((state, e) => next(state, e, REFUNDABLE), 'placed');

  test('happy path: pay, ship, deliver, refund', () => assert.equal(run(['pay', 'ship', 'deliver', 'refund']), 'refunded'));
  test('cancel straight away', () => assert.equal(run(['cancel']), 'cancelled'));
  test('pay then cancel', () => assert.equal(run(['pay', 'cancel']), 'cancelled'));
  test('cannot cancel once shipped', () => assert.throws(() => run(['pay', 'ship', 'cancel']), InvalidTransition));
  test('cannot refund twice', () => assert.throws(() => run(['pay', 'ship', 'deliver', 'refund', 'refund']), InvalidTransition));
});

describe('guarded transition: refund needs an accepted claim', () => {
  test('a late claim blocks the refund transition', () => {
    assert.throws(() => next('delivered', 'refund', { ...REFUNDABLE, daysSinceDelivery: 31 }), /outside the 30-day window/);
  });
});
