import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createReturns } from '../../../app/src/returns.js';

// Learning Path, Topic 3 — controlling time.
//
// "Within 30 days of delivery" depends on what time it is NOW. A test that
// reads the real clock gives different answers on different days. So the
// returns service takes its clock as a dependency, and each test sets the
// time it needs. Times carry an explicit offset (+02:00 is summer time in
// Berlin), so the tests pass in every time zone, including CI's UTC.

const delivered = (deliveredAt) => ({ state: 'delivered', deliveredAt });
const at = (iso) => () => new Date(iso);

describe('refund window, with an injected clock', () => {
  test('a claim on the day of delivery is in time', () => {
    const returns = createReturns({ clock: at('2026-05-01T18:00:00+02:00') });
    assert.equal(returns.assess(delivered('2026-05-01T10:00:00+02:00')).refund, true);
  });

  test('a claim 30 days later, at midday, is still in time', () => {
    const returns = createReturns({ clock: at('2026-05-31T12:00:00+02:00') });
    const result = returns.assess(delivered('2026-05-01T12:00:00+02:00'));
    assert.equal(result.days, 30);
    assert.equal(result.refund, true);
  });

  test('a claim 31 days later is too late', () => {
    const returns = createReturns({ clock: at('2026-06-01T12:00:00+02:00') });
    assert.equal(returns.assess(delivered('2026-05-01T12:00:00+02:00')).refund, false);
  });

  test('an order that is not delivered yet cannot be refunded', () => {
    const returns = createReturns({ clock: at('2026-05-02T12:00:00+02:00') });
    assert.match(returns.assess({ state: 'shipped' }).reason, /not delivered/);
  });

  // Found by asking "what about just after midnight?" The policy counts
  // calendar days in the shop's time zone: delivered on 1 May, a claim on
  // 1 June is day 31, whatever the hour. The code counts 24-hour periods, so
  // 23:30 on 1 May → 00:10 on 1 June is only 30 periods and 40 minutes.
  test(
    'calendar days count, not 24-hour periods: 1 May 23:30 → 1 June 00:10 is day 31',
    { todo: 'real bug: daysSinceDelivery counts 24-hour periods; Topic 3 lab, step 2' },
    () => {
      const returns = createReturns({ clock: at('2026-06-01T00:10:00+02:00') });
      const result = returns.assess(delivered('2026-05-01T23:30:00+02:00'));
      assert.equal(result.days, 31);
      assert.equal(result.refund, false);
    },
  );
});

describe('the alternative: faking the global clock', () => {
  // node:test can replace Date itself. Useful for code you can't change, but
  // every test now shares one global, and it hides the dependency instead of
  // making it explicit. Prefer injection for code you own.
  test('the default clock reads Date, so mock timers can control it', (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-05-31T12:00:00+02:00') });
    const result = createReturns().assess(delivered('2026-05-01T12:00:00+02:00'));
    assert.equal(result.days, 30);
  });
});
