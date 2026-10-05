import http from 'k6/http';
import { check } from 'k6';

// Topic 8 stretch - find the knee. Arrival-rate (open model) load keeps sending
// requests at the target rate even when the server slows down, which is how
// real traffic behaves; a closed model (fixed VUs) politely backs off and
// hides the problem.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3210';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-arrival-rate',
      startRate: 20,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 300,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 600 },
      ],
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true }],
    http_req_duration: ['p(99)<1000'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/books`);
  check(res, { 'status 200': (r) => r.status === 200 });
}
