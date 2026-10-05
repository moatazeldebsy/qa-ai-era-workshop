#!/usr/bin/env node
// npm run obs:synthetic — a synthetic monitor: one scripted customer journey,
// run against a live environment on a schedule (cron, CI, a monitoring
// service). It finds out that orders are broken before a customer does.
//
//   BASE_URL=http://localhost:3210 npm run obs:synthetic
//
// Every request is labelled as synthetic (header + email domain), so it can
// be kept out of business metrics, and the journey cleans up after itself.
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3210';
const run = `synthetic-${Date.now()}`;
const headers = { 'content-type': 'application/json', 'x-synthetic': 'true', 'x-request-id': run };

const steps = [
  ['shop is up', async () => (await fetch(`${BASE_URL}/health`, { headers })).status === 200],
  ['search finds the k6 book', async () => {
    const res = await fetch(`${BASE_URL}/api/books?q=k6`, { headers });
    return res.status === 200 && (await res.json()).books.length === 1;
  }],
  ['a cart over 50 EUR ships free', async () => {
    const res = await fetch(`${BASE_URL}/api/cart/price`, { method: 'POST', headers, body: JSON.stringify({ items: [{ bookId: 1, quantity: 2 }] }) });
    return res.status === 200 && (await res.json()).shipping === 0;
  }],
  ['an order can be placed and cancelled', async (ctx) => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items: [{ bookId: 6, quantity: 1 }], paymentToken: 'tok_visa', customer: { email: 'monitor@synthetic.example' } }),
    });
    if (res.status !== 201) return false;
    ctx.order = (await res.json()).id;
    const cancel = await fetch(`${BASE_URL}/api/orders/${ctx.order}/cancel`, { method: 'POST', headers, body: '{}' });
    return cancel.status === 200;
  }],
];

const ctx = {};
let ok = true;
console.log(`Synthetic journey ${run} against ${BASE_URL}\n`);
for (const [name, step] of steps) {
  const start = performance.now();
  let passed = false;
  let error = '';
  try {
    passed = await step(ctx);
  } catch (err) {
    error = err.cause?.code ?? err.message;
  }
  const ms = Math.round(performance.now() - start);
  console.log(`${passed ? '✔' : '✖'} ${name.padEnd(38)} ${String(ms).padStart(5)} ms${error ? `  (${error})` : ''}`);
  if (!passed) {
    ok = false;
    break; // later steps depend on earlier ones
  }
}
console.log(ok ? '\n✔ Journey healthy.' : '\n✖ Journey FAILED: page someone, or open an incident.');
process.exit(ok ? 0 : 1);
