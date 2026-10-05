import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReturns } from '../../../app/src/returns.js';

// The returns policy counts calendar days in the shop's time zone (Berlin).
const assess = (deliveredAt, now) => createReturns({ clock: () => new Date(now) }).assess({ state: 'delivered', deliveredAt });

const cases = [
  // [delivered, claim, expected days, refund?]
  ['2026-05-01T23:30:00+02:00', '2026-06-01T00:10:00+02:00', 31, false], // just after midnight
  ['2026-05-01T21:30:00Z', '2026-05-31T22:10:00Z', 31, false], // same moments, written in UTC
  ['2026-05-01T23:30:00+02:00', '2026-05-31T23:59:00+02:00', 30, true], // last minute of day 30
  ['2026-05-01T00:10:00+02:00', '2026-05-31T23:50:00+02:00', 30, true],
  ['2026-05-01T22:30:00Z', '2026-06-01T12:00:00+02:00', 30, true], // delivered just after midnight Berlin time
  ['2026-03-28T12:00:00+01:00', '2026-04-27T12:00:00+02:00', 30, true], // across the spring clock change
  ['2026-10-24T23:30:00+02:00', '2026-11-23T23:59:00+01:00', 30, true], // across the autumn clock change
  ['2026-10-24T23:30:00+02:00', '2026-11-24T00:01:00+01:00', 31, false],
];

for (const [deliveredAt, now, days, refund] of cases) {
  test(`delivered ${deliveredAt}, claim ${now} → day ${days}, refund ${refund}`, () => {
    const result = assess(deliveredAt, now);
    assert.equal(result.days, days);
    assert.equal(result.refund, refund);
  });
}
