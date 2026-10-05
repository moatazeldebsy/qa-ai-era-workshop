# Topic 8 · Lab

## 14. Hands-on lab: fast, under load, and when things break

You'll read a smoke test, fix a load test that reports great latency for a failing system, make the shop fail fast when its dependency hangs, and find a leak that only odd traffic over time reveals.

**Time:** 2.5 hours

!!! abstract "Same routine as before"
    `npm run learn:start 8` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 8` to see what's left · thinking work goes in `notebook/08/perf-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `labs/08-performance/k6/smoke.js` | 10 virtual users browsing and pricing carts for 35 s, with thresholds (from the workshop's Lab 5) |
| `labs/08-performance/k6/orders.js` | An open-model load test of the whole checkout: 20 orders per second |
| `labs/08-performance/k6/stress.js` | A ramping arrival rate to find the knee |
| `labs/08-performance/chaos-proxy.mjs` | A fault-injecting proxy: latency and errors on demand |
| `labs/08-performance/tests/resilience.test.js` | The shop against a misbehaving inventory service; two TODO findings |
| `app/src/inventory-client.js`, `app/src/server.js` | Where the fixes go |

### Step 0 — Baseline

```bash
k6 version                          # install k6 first if this fails
npm run learn:start 8
mkdir -p notebook/08 && cp notebook/_templates/08/perf-notes.md notebook/08/
npm run perf:test
```

```text title="Expected output (summary)"
ℹ tests 4
ℹ suites 2
ℹ pass 2
ℹ fail 0
ℹ todo 2
```

The run takes about 3 seconds longer than it should. Remember that; step 3 explains it.

### Step 1 — Read a load test (20 min)

Start the shop and run the smoke test:

```bash
npm start                 # terminal 1
npm run perf:smoke        # terminal 2
```

```text title="Expected output (end, numbers vary)"
  books p95: 2.9 ms
  cart  p95: 1.3 ms
  errors:    0.00%
  thresholds:
    PASS  checks
    PASS  http_req_duration{endpoint:books}
    PASS  http_req_duration{endpoint:cart}
    PASS  http_req_failed
```

Open `labs/08-performance/k6/smoke.js` and read the `thresholds`: one per endpoint, on p95, plus error rate and content checks. k6 exits non-zero when one is crossed, and that's what makes it a CI check.

Make it fail on purpose: add `await new Promise((r) => setTimeout(r, 250));` at the start of the `/api/books` handler in `app/src/server.js`, restart the shop, and run the smoke test again. The books threshold fails and k6 exits non-zero. **Remove the delay.** Then try `BUG_MODE=cart npm start`: fast, but wrong. The `checks` threshold fails, because a fast wrong answer is still wrong.

Record the p95 numbers in your notebook, and why p95 is more useful than the average.

### Step 2 — A load test that lies (35 min)

Start both services with Topic 7's test-data API switched on, then run the order load test:

```bash
INVENTORY_TEST_DATA=on npm run start:all    # terminal 1 (stop npm start first)
npm run perf:orders                         # terminal 2
```

```text title="Expected output (excerpt)"
     ✗ order placed (201)
      ↳  2% — ✓ 12 / ✗ 389
     ✓ { endpoint:order }...........: avg=2.87ms   min=1.03ms   med=2.48ms   max=42.71ms  p(90)=3.99ms   p(95)=4.64ms
   ✗ http_req_failed................: 97.00% ✓ 389       ✗ 12
```

A p95 under 5 ms, which passes, and 97% of requests failed. Note in your notebook why the latency looks so good.

??? tip "Hint"
    How many copies of book 1 does the inventory service start with? How many orders does 20 per second for 20 seconds place? And how long does it take to answer *"no stock"*?

**Your task:** make the load test give itself the data it needs before the first virtual user starts, using the test-data API from Topic 7. Don't change the thresholds.

??? tip "Hint: where"
    k6 runs an exported `setup()` function once, before the load starts. `http.put(url, body, params)` works there like anywhere else. The inventory URL is already in the script.

??? success "Reference solution"
    ```js
    export function setup() {
      const res = http.put(`${INVENTORY_URL}/stock/1`, JSON.stringify({ available: 100000 }), {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.status !== 200) throw new Error(`could not stock book 1 (${res.status}): start the services with INVENTORY_TEST_DATA=on`);
    }
    ```

```text title="Expected output after the fix (excerpt)"
   ✓ checks.........................: 100.00% ✓ 401       ✗ 0
     ✓ { endpoint:order }...........: avg=2.9ms    min=1.16ms  med=2.6ms    max=37.72ms  p(90)=4.04ms   p(95)=4.68ms
   ✓ http_req_failed................: 0.00%   ✓ 0         ✗ 402
```

### Step 3 — A slow dependency (35 min)

`resilience.test.js` puts the chaos proxy between the shop and the inventory service. Read the three tests in the first `describe`, then run them with the spec reporter:

```bash
node --test --test-reporter=spec labs/08-performance/tests/resilience.test.js
```

The TODO test asks the proxy for 3 s of latency and expects the shop to answer 503 within 1.5 s. Today it waits the full 3 seconds and then succeeds: the client has no timeout at all.

**Your task:** before changing code, use Little's Law (section 3 of the Concepts) to estimate how many orders would be waiting at once if 20 orders per second each waited 30 seconds. Write it in your notebook. Then give the inventory client a timeout, so a slow inventory service becomes a fast `InventoryError` (and so a 503), while normal calls still succeed.

??? tip "Hint"
    `fetch(url, { signal: AbortSignal.timeout(ms) })` aborts a request after `ms` milliseconds. The client already turns fetch errors into `InventoryError`. Pick a value: a 300 ms inventory response must still work (the acceptance checks test both sides).

??? success "Reference solution"
    ```js
    export function createInventoryClient({ baseUrl, fetch: rawFetch = globalThis.fetch, timeoutMs = 1000 }) {
      const http = async (url, options) => {
        try {
          return await rawFetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
        } catch (err) {
          throw new InventoryError(`inventory service unreachable: ${err.cause?.code ?? err.message}`);
        }
      };
      // …
    ```

Remove the TODO. Then answer in your notebook: why not *retry* the reservation instead? (Section 4.6.)

### Step 4 — A leak only time reveals (25 min)

The second TODO simulates what scanners and bots do all day: request lots of URLs that don't exist (`/wp-admin/1.php`, `/wp-admin/2.php`, …) and count the request-metric series in `/metrics`.

```text title="Expected output (excerpt)"
✖ unknown URLs do not create new metric series
  AssertionError [ERR_ASSERTION]: 51 new series from 50 unknown URLs
```

See it for yourself: with `npm start` running, request a few made-up paths with `curl`, then `curl localhost:3210/metrics`.

**Your task:** find where `server.js` builds the metric key, and make unknown URLs share one bounded label, while real routes keep their pattern (`/api/books/:id`).

??? tip "Hint"
    `req.route?.path` is the route pattern Express matched. When nothing matched, the code falls back to `req.path`: the raw URL, which is unbounded.

??? success "Reference solution"
    ```js
    const key = `${req.method} ${req.route?.path ?? 'unmatched'} ${res.statusCode}`;
    ```

Remove the TODO and run `npm run perf:test`: `ℹ pass 4`, `ℹ todo 0`, and it's 3 seconds faster.

### Stretch — Find the knee

```bash
npm start
npm run perf:stress
```

The stress test ramps an open arrival rate up to 600 requests per second. Where do latency and errors start to climb on your machine? Compare it with a closed model by switching the executor to `ramping-vus`, and note why the closed model hides the overload.

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 8
```

```text title="Expected output"
✔ Step 2 — The order load test sets up its own data and meets its thresholds
    20 orders/s for 20 s: thresholds met
✔ Step 3-4 — The shop fails fast on a slow dependency, and unknown URLs no longer leak metrics
    fast 503 when inventory is slow; bounded metric series
✔ Step 5 — Notes: percentiles, load-test data, timeouts and the soak finding
    notebook/08/perf-notes.md

3/3 steps done for Topic 8: Performance, Load, and Resilience Testing
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

The checker starts both services itself on ports 3510 and 3520, so you don't need anything running. Commit and push to your fork when you're done.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `k6: command not found` | k6 isn't installed | `brew install k6` · `winget install k6` · Codespaces has it |
| `could not stock book 1 (404)` | The test-data API is off | Start with `INVENTORY_TEST_DATA=on npm run start:all` |
| Orders return 503 in the load test | Only the shop is running | `npm run start:all`, not `npm start` |
| `EADDRINUSE` | A previous `npm start` or `start:all` is still running | Stop it (`Ctrl+C`), or change `PORT` / `INVENTORY_PORT` |
| p95 much higher than the examples | A busy laptop, a debugger, or `LOG_REQUESTS` on | Numbers are relative to your machine; compare runs on the same machine |
| The acceptance check "300 ms still works" fails | Your timeout is shorter than 300 ms | Base the timeout on the dependency's normal latency, with headroom |
| The metrics test reports 2 new series | The `/metrics` request itself adds a series the first time | The test warms it up first; keep that line |
| The stress test aborts early | `abortOnFail` stopped it when errors passed 5% | That *is* the knee; read the rate it reached |
