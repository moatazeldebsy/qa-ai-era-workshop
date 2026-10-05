import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateOrders } from '../generate.mjs';
import { salesReport } from '../../../app/src/reports.js';

const KEPT = (o) => !['cancelled', 'refunded'].includes(o.state);
const cents = (n) => Math.round(n * 100) / 100;

test('the generator is reproducible: same seed, same orders; new seed, new orders', () => {
  assert.deepEqual(generateOrders({ count: 80, seed: 5 }), generateOrders({ count: 80, seed: 5 }));
  assert.notDeepEqual(generateOrders({ count: 80, seed: 5 }), generateOrders({ count: 80, seed: 6 }));
});

test('the report only counts money the shop kept, in every figure', () => {
  const history = generateOrders({ count: 400, seed: 99 });
  const kept = history.filter(KEPT);
  const report = salesReport(history);
  const revenue = cents(kept.reduce((n, o) => n + o.total, 0));
  assert.equal(report.orders, kept.length);
  assert.equal(report.revenue, revenue);
  assert.equal(report.averageOrderValue, cents(revenue / kept.length));
  const copies = kept.flatMap((o) => o.lines).reduce((n, l) => n + l.quantity, 0);
  assert.equal(report.books.reduce((n, b) => n + b.copies, 0), copies);
});

test('a history of only cancelled and refunded orders reports nothing earned', () => {
  const undone = generateOrders({ count: 200, seed: 8 }).filter((o) => !KEPT(o));
  const report = salesReport(undone);
  assert.equal(report.revenue, 0);
  assert.equal(report.topCustomer, null);
});
