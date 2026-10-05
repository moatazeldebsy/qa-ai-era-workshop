import http from 'k6/http';
import { check, sleep } from 'k6';

// Topic 8 — load test the checkout: customers placing orders. Every order
// goes through the shop to the inventory service and the demo payment
// provider, so this exercises the whole path, not just one endpoint.
//
//   INVENTORY_TEST_DATA=on npm run start:all      (terminal 1)
//   npm run perf:orders                           (terminal 2)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3210';
const INVENTORY_URL = __ENV.INVENTORY_URL || 'http://localhost:3220';

export const options = {
  scenarios: {
    checkout: {
      executor: 'constant-arrival-rate',
      rate: 20, // orders per second
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:order}': ['p(95)<300'],
    checks: ['rate>0.99'],
  },
};

// Load tests need data too (Topic 7). 20 orders a second for 20 s is about
// 400 copies; book 1 starts with 12. Give the test the stock it needs,
// through the test-data API, before the first virtual user starts.
export function setup() {
  const res = http.put(`${INVENTORY_URL}/stock/1`, JSON.stringify({ available: 100000 }), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`could not stock book 1 (${res.status}): start the services with INVENTORY_TEST_DATA=on`);
}

export default function () {
  const res = http.post(
    `${BASE_URL}/api/orders`,
    JSON.stringify({ items: [{ bookId: 1, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: `load-${__VU}-${__ITER}@example.com` } }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'order' } },
  );
  check(res, { 'order placed (201)': (r) => r.status === 201 });
  sleep(0.1);
}
