# Lab 5 — Performance with k6

**Time:** 30 min · **Tracks:** QA, Dev · **Module:** [3. Tools & Technologies](../modules/03-tools-and-technologies.md)

## Goal

Make performance a **pass/fail check in every pipeline run** with thresholds, and learn how to find a system's limit.

## Files

- `labs/k6/smoke.js`: 10 virtual users for 35 s, with thresholds; writes `test-results/k6-summary.json`
- `labs/k6/stress.js`: ramps an open-model arrival rate to find the knee

## Steps

**1. Start the app** in one terminal: `npm start`.

**2. Run the smoke test** in another:

```bash
npm run perf:smoke
```

At the end, k6 prints p95 latencies and a PASS/FAIL per threshold. The exit code is non-zero if any threshold fails, and that's what makes it a CI check.

**3. Read the thresholds** in `smoke.js`:

```js
thresholds: {
  http_req_failed: ['rate<0.01'],
  'http_req_duration{endpoint:books}': ['p(95)<200'],
  'http_req_duration{endpoint:cart}': ['p(95)<300'],
  checks: ['rate>0.99'],
}
```

Why p95 and not the average? Why per endpoint?

**4. Make it fail.** Add an artificial delay to the books endpoint in `app/src/server.js`:

```js
app.get('/api/books', async (req, res) => {
  await new Promise((r) => setTimeout(r, 250)); // regression
  res.json({ books: searchBooks(req.query.q) });
});
```

Restart the app and re-run: the books threshold fails and k6 exits non-zero. Remove the delay.

**5. Check the functional side too.** The smoke test also asserts on *content* (`two AI titles`, `free shipping over 50`). A fast wrong answer is still wrong.

## Stretch goals

- Run `k6 run labs/k6/stress.js` and watch where latency climbs and errors start. Note the requests per second at the knee.
- Compare `ramping-vus` (closed model) with `ramping-arrival-rate` (open model). Why does the open model expose overload that the closed one hides?
- Add a scenario for `/api/assistant`. What threshold makes sense for an LLM-backed endpoint in `claude` mode, and what does each run cost?

## Debrief

1. What are your production p95 targets? Who agreed them?
2. Where should the smoke test run: every PR, nightly, or before release?
3. What is the difference between a performance *test* and performance *monitoring*?
