import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Lab 5 - performance smoke test. A small, always-on load that runs in CI and
// fails the build when latency or errors regress. Thresholds ARE the test:
// k6 exits non-zero when one is crossed.
//
//   k6 run labs/k6/smoke.js
//   BASE_URL=https://staging.example k6 run labs/k6/smoke.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3210';

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 10 },
        { duration: '5s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // under 1% errors
    'http_req_duration{endpoint:books}': ['p(95)<200'], // catalogue p95 under 200 ms
    'http_req_duration{endpoint:cart}': ['p(95)<300'],
    checks: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max'],
};

export default function () {
  group('browse catalogue', () => {
    const res = http.get(`${BASE_URL}/api/books?q=ai`, { tags: { endpoint: 'books' } });
    check(res, {
      'books: status 200': (r) => r.status === 200,
      'books: two AI titles': (r) => r.json('books').length === 2,
    });
  });

  group('price a cart', () => {
    const res = http.post(
      `${BASE_URL}/api/cart/price`,
      JSON.stringify({ items: [{ bookId: 1, quantity: 2 }] }),
      { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'cart' } },
    );
    check(res, {
      'cart: status 200': (r) => r.status === 200,
      'cart: free shipping over 50': (r) => r.json('shipping') === 0,
    });
  });

  sleep(1);
}

// Machine-readable summary for the quality gate (Lab 7).
export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    'test-results/k6-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const p95 = (name) => data.metrics[name]?.values?.['p(95)']?.toFixed(1) ?? 'n/a';
  const failed = ((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2);
  const lines = [
    '',
    `  books p95: ${p95('http_req_duration{endpoint:books}')} ms`,
    `  cart  p95: ${p95('http_req_duration{endpoint:cart}')} ms`,
    `  errors:    ${failed}%`,
    '  thresholds:',
    ...Object.entries(data.metrics)
      .filter(([, m]) => m.thresholds)
      .map(([name, m]) => `    ${Object.values(m.thresholds).every((t) => t.ok) ? 'PASS' : 'FAIL'}  ${name}`),
    '',
  ];
  return lines.join('\n');
}
