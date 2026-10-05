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

export default function () {
  const res = http.post(
    `${BASE_URL}/api/orders`,
    JSON.stringify({ items: [{ bookId: 1, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: `load-${__VU}-${__ITER}@example.com` } }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'order' } },
  );
  check(res, { 'order placed (201)': (r) => r.status === 201 });
  sleep(0.1);
}

void INVENTORY_URL; // the test-data API lives here (Topic 7): see lab step 2
