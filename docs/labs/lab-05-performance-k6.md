# Lab 5 — Performance with k6

Make performance a pass/fail check that runs in every pipeline, and learn how to find where a system starts to break.

By the end you'll have:

- run a **k6 smoke test** whose thresholds decide pass or fail
- **broken a threshold** with a planted slowdown, and seen k6 exit non-zero
- the evidence file (`test-results/k6-summary.json`) that the quality gate reads in [Lab 7](lab-07-quality-gate.md)

**Time:** 30 min · **Tracks:** QA, Dev · **Module:** [3. Tools & Technologies](../modules/03-tools-and-technologies.md)

## Prerequisites

- The [Quickstart](../start/setup.md) is done.
- **k6** is installed (`k6 version`).

| File | What's in it |
|---|---|
| `labs/08-performance/k6/smoke.js` | 10 virtual users for 35 s, thresholds, a summary for the gate |
| `labs/08-performance/k6/stress.js` | An open-model arrival rate ramp, to find the knee |

## 1. Start the app

```bash
npm start
```

Leave it running and use a second terminal for the rest of the lab.

## 2. Run the smoke test

```bash
npm run perf:smoke
```

```text title="Expected output"
  books p95: 2.2 ms
  cart  p95: 1.5 ms
  errors:    0.00%
  thresholds:
    PASS  checks
    PASS  http_req_duration{endpoint:cart}
    PASS  http_req_failed
    PASS  http_req_duration{endpoint:books}
```

k6 exits with **0**. That exit code is what makes this a CI check.

## 3. Read the thresholds

```js title="labs/08-performance/k6/smoke.js"
thresholds: {
  http_req_failed: ['rate<0.01'],                       // under 1% errors
  'http_req_duration{endpoint:books}': ['p(95)<200'],   // catalogue p95 under 200 ms
  'http_req_duration{endpoint:cart}': ['p(95)<300'],
  checks: ['rate>0.99'],
},
```

!!! question "Discuss before moving on"
    Why p95 and not the average? Why one threshold per endpoint rather than one for everything?

## 4. Make it fail

Plant a slowdown in the books endpoint:

```js title="app/src/server.js"
app.get('/api/books', async (req, res) => {
  await new Promise((r) => setTimeout(r, 250)); // regression
  res.json({ books: searchBooks(req.query.q) });
});
```

Restart the app and run the smoke test again:

```text title="Expected output"
  books p95: 254.6 ms
  ...
    FAIL  http_req_duration{endpoint:books}
time="…" level=error msg="thresholds on metrics 'http_req_duration{endpoint:books}' have been crossed"
```

k6 exits non-zero. Remove the delay and restart.

## 5. Check content, not just speed

The smoke test also asserts on what comes back:

```js title="labs/08-performance/k6/smoke.js"
check(res, {
  'books: two AI titles': (r) => r.json('books').length === 2,
  'cart: free shipping over 50': (r) => r.json('shipping') === 0,
});
```

A fast wrong answer is still wrong. Try `BUG_MODE=cart npm start` and watch the `checks` threshold fail.

## The whole lab, end to end

```bash
npm start                         # 1. terminal 1
npm run perf:smoke                # 2. terminal 2 → all PASS, exit 0
# 4. add the 250 ms delay, restart, re-run → FAIL, exit 99
k6 run labs/08-performance/k6/stress.js          # stretch: find the knee
```

## Stretch goals

- Run `k6 run labs/08-performance/k6/stress.js` and note where latency climbs and errors start, in requests per second.
- Compare `ramping-vus` (a closed model) with `ramping-arrival-rate` (an open model). Why does the open model show overload that the closed one hides?
- Add a scenario for `/api/assistant`. What threshold suits an LLM-backed endpoint in `claude` mode, and what does each test run cost?

## Debrief

1. What are your production p95 targets? Who agreed them?
2. Where should the smoke test run: every PR, nightly, or before release?
3. What is the difference between performance *testing* and performance *monitoring*?

## Next steps

<div class="grid cards" markdown>

-   **Lab 6 — Evaluating an LLM feature**

    ---

    A regression suite for the AI assistant: grounding, injection and scope.

    [→ Lab 6](lab-06-llm-evaluation.md)

-   **Lab 7 — Quality gates**

    ---

    The k6 summary from this lab becomes one input to the release decision.

    [→ Lab 7](lab-07-quality-gate.md)

</div>
