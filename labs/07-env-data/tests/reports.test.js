import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { salesReport } from '../../../app/src/reports.js';
import { generateOrders } from '../generate.mjs';

// Learning Path, Topic 7 — the same report, tested with hand-made data and
// with realistic generated data.

const order = (id, email, total, lines, state = 'delivered') => ({ id, state, customer: { email }, total, lines });
const FIXTURE = [
  order('o1', 'ada@example.com', 34.89, [{ bookId: 1, title: 'Testing in Production', quantity: 1, lineTotal: 29.99 }]),
  order('o2', 'alan@example.com', 68, [{ bookId: 3, title: 'Prompting for QA', quantity: 2, lineTotal: 68 }]),
  order('o3', 'ada@example.com', 59.98, [{ bookId: 1, title: 'Testing in Production', quantity: 2, lineTotal: 59.98 }]),
];

describe('with a hand-made fixture', () => {
  test('revenue is the sum of order totals', () => assert.equal(salesReport(FIXTURE).revenue, 162.87));
  test('the best-selling book by revenue comes first', () => assert.equal(salesReport(FIXTURE).books[0].bookId, 1));
  test('the top customer is the one who spent most', () => assert.deepEqual(salesReport(FIXTURE).topCustomer, { email: 'ada@example.com', spent: 94.87 }));
  test('an empty history reports zeros', () => assert.deepEqual(salesReport([]), { orders: 0, revenue: 0, averageOrderValue: 0, books: [], topCustomer: null }));
});

describe('with realistic generated data', () => {
  // A real order history isn't only delivered orders. Revenue is money the
  // shop keeps, so it must leave out cancelled and refunded orders.
  test(
    'revenue only counts orders the shop kept the money for',
    () => {
      const history = generateOrders({ count: 500, seed: 7 });
      const kept = history.filter((o) => !['cancelled', 'refunded'].includes(o.state));
      const expected = Math.round(kept.reduce((n, o) => n + o.total, 0) * 100) / 100;
      const report = salesReport(history);
      assert.equal(report.revenue, expected);
      assert.equal(report.orders, kept.length);
    },
  );
});
