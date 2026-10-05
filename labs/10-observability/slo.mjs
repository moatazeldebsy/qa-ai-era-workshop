#!/usr/bin/env node
// npm run obs:slo — service level indicators, objectives and error budgets,
// computed from the shop's own /metrics.
//
//   BASE_URL=http://localhost:3210 npm run obs:slo            read the metrics as they are
//   BASE_URL=… npm run obs:slo -- --warmup 300                send 300 requests first
//
// Availability SLI = API requests without a 5xx / all API requests.
// Latency SLI      = API requests faster than the threshold / all API requests
//                    (needs a latency histogram in /metrics).
// Error budget     = how much of the allowed failure (1 − target) is used up.
import fs from 'node:fs';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3210';
const { objectives, window } = JSON.parse(fs.readFileSync('labs/10-observability/slo.json', 'utf8'));
const warmup = Number(process.argv[process.argv.indexOf('--warmup') + 1]) || 0;

if (warmup) {
  const calls = [
    () => fetch(`${BASE_URL}/api/books?q=ai`),
    () => fetch(`${BASE_URL}/api/books/3`),
    () => fetch(`${BASE_URL}/api/cart/price`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"items":[{"bookId":1,"quantity":2}]}' }),
  ];
  for (let i = 0; i < warmup; i++) await calls[i % calls.length]();
}

const text = await (await fetch(`${BASE_URL}/metrics`)).text();
const isApi = (labels) => /route="\/api\//.test(labels);
let total = 0;
let failed = 0;
for (const [, labels, value] of text.matchAll(/^http_requests_total\{([^}]*)\} (\d+)/gm)) {
  if (!isApi(labels)) continue;
  total += Number(value);
  if (/status="5\d\d"/.test(labels)) failed += Number(value);
}
if (!total) {
  console.error('✖ No API requests recorded yet. Use some of the shop, or run with --warmup 300.');
  process.exit(1);
}

const pct = (x) => `${(x * 100).toFixed(3)}%`;
const budget = (sli, target) => {
  const allowed = 1 - target;
  const used = (1 - sli) / allowed;
  return used <= 1 ? `${pct(1 - used)} of the error budget left` : `error budget EXHAUSTED (${(used * 100).toFixed(0)}% used)`;
};

console.log(`SLOs over ${window}: measured from ${total} API requests since the shop started\n`);
const availability = (total - failed) / total;
console.log(`Availability   SLI ${pct(availability)}   objective ${pct(objectives.availability.target)}   ${budget(availability, objectives.availability.target)}`);

const le = objectives.latency.thresholdSeconds;
let fast = 0;
let counted = 0;
for (const [, labels, value] of text.matchAll(/^http_request_duration_seconds_bucket\{([^}]*)\} (\d+)/gm)) {
  if (!isApi(labels)) continue;
  if (labels.includes(`le="${le}"`)) fast += Number(value);
  if (labels.includes('le="+Inf"')) counted += Number(value);
}
if (!counted) {
  console.log(`Latency        ✖ can't measure: /metrics has no http_request_duration_seconds histogram with a le="${le}" bucket`);
  process.exit(1);
}
const latency = fast / counted;
console.log(`Latency        SLI ${pct(latency)}   objective ${pct(objectives.latency.target)} under ${le * 1000} ms   ${budget(latency, objectives.latency.target)}`);
