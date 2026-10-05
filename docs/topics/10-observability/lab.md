# Topic 10 · Lab

## 14. Hands-on lab: seeing the shop from the outside

You'll ask the shop's telemetry the questions an on-call engineer would, find out which it can't answer, and fix three real gaps. Then you'll measure SLOs and run a synthetic monitor that catches an outage the health check reports as fine.

**Time:** 2 hours

!!! abstract "Same routine as before"
    `npm run learn:start 10` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 10` to see what's left · thinking work goes in `notebook/10/observability-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `app/src/server.js` | The shop's request logging, `/health` and `/metrics` |
| `app/src/inventory-client.js`, `services/inventory/src/app.js` | Where the request id should travel to, and be logged |
| `labs/10-observability/tests/observability.test.js` | Telemetry tests; three TODO findings |
| `labs/10-observability/slo.json`, `slo.mjs` | The shop's SLOs, and a calculator that reads `/metrics` |
| `labs/10-observability/synthetic.mjs` | A synthetic customer journey for live environments |

### Step 0 — Baseline

```bash
npm run learn:start 10
mkdir -p notebook/10 && cp notebook/_templates/10/observability-notes.md notebook/10/
npm run obs:test
```

```text title="Expected output (summary)"
ℹ tests 6
ℹ suites 3
ℹ pass 3
ℹ fail 0
ℹ todo 3
```

### Step 1 — Question the telemetry (20 min)

Start both services and place an order that fails, with your own request id:

```bash
npm run start:all                                  # terminal 1: watch its output
curl -s localhost:3210/api/orders -H 'content-type: application/json' -H 'x-request-id: debug-order-1' \
  -d '{"items":[{"bookId":1,"quantity":1}],"paymentToken":"tok_declined","customer":{"email":"ada@example.com"}}'
curl -s localhost:3210/metrics
```

```text title="Expected output in terminal 1"
[shop] {"level":"info","id":"debug-order-1","method":"POST","path":"/api/orders","status":402,"ms":41}
```

The shop logged one structured line with your id. The inventory service, which reserved stock for that order, logged nothing.

Fill in the table in your notebook: for each question an on-call engineer might ask, can today's logs and metrics answer it?

### Step 2 — One id across services (25 min)

The first TODO in `observability.test.js` sends an order with `x-request-id: order-trace-42` and checks that the inventory service received the same id.

**Your task:** make the shop's inventory client forward the id of the request being handled, and make the inventory service echo it and log it. Don't pass the id through `placeOrder` and every function in between.

??? tip "Hint"
    Node's `AsyncLocalStorage` (`node:async_hooks`) keeps a value for the duration of an async call chain. Set it in the shop's request-id middleware with `requestContext.run({ requestId: id }, next)`, read it in the inventory client, and add the header there.

??? success "Reference solution"
    A new `app/src/request-context.js`:

    ```js
    import { AsyncLocalStorage } from 'node:async_hooks';
    export const requestContext = new AsyncLocalStorage();
    export const currentRequestId = () => requestContext.getStore()?.requestId;
    ```

    In `server.js`, the middleware ends with `requestContext.run({ requestId: id }, next);` instead of `next();`. The client adds `'x-request-id': currentRequestId()` to each request's headers when there is one. The inventory service gets the same request-id middleware and logs `{ service: 'inventory', id, … }`. The full diff is on the solutions branch.

Restart `npm run start:all` and repeat the failing order: both services now log `debug-order-1`. In your notebook, note what OpenTelemetry would add on top of this (spans, timings, parent and child).

### Step 3 — A health check that tells the truth (25 min)

Stop `start:all`. Run the shop **without** the inventory service and ask it how it is:

```bash
npm start                                          # terminal 1: the inventory service is NOT running
curl -s -w ' %{http_code}\n' localhost:3210/health
```

```text title="Expected output"
{"status":"ok"} 200
```

Every order fails, yet the shop says it's fine. A load balancer would keep sending customers to it.

**Your task:** keep `/health` as the **liveness** check (the process is up), and add a **readiness** check, `/ready`, that answers 503 when the inventory service can't be reached. It must answer within a second even if the inventory service hangs.

??? tip "Hint"
    Ask the inventory service's own `/health`, with `AbortSignal.timeout(500)`. The acceptance checks use Topic 8's chaos proxy to make it fail and hang.

??? success "Reference solution"
    ```js
    app.get('/ready', async (_req, res) => {
      try {
        const inv = await fetch(`${inventoryUrl}/health`, { signal: AbortSignal.timeout(500) });
        if (!inv.ok) throw new Error(`inventory answered ${inv.status}`);
        res.json({ status: 'ready' });
      } catch {
        res.status(503).json({ status: 'not ready', inventory: 'unreachable' });
      }
    });
    ```

In your notebook: why must liveness *not* check the inventory service?

### Step 4 — Measure an SLO (30 min)

`labs/10-observability/slo.json` holds two objectives: **99.5%** of API requests without a 5xx, and **99%** answered within **250 ms**. Compute them from the running shop:

```bash
npm start                                          # terminal 1
npm run obs:slo -- --warmup 300                    # terminal 2
```

```text title="Expected output"
SLOs over 30 days: measured from 304 API requests since the shop started

Availability   SLI 100.000%   objective 99.500%   100.000% of the error budget left
Latency        ✖ can't measure: /metrics has no http_request_duration_seconds histogram with a le="0.25" bucket
```

The shop counts requests but never times them. The third TODO describes the histogram it needs.

**Your task:** add a Prometheus-style latency histogram, `http_request_duration_seconds`, per method and route pattern, with buckets including `0.25`, plus `_sum` and `_count`. Then run the SLO report again.

??? tip "Hint"
    Keep, per route, a count for each bucket (requests that took *at most* that many seconds), a total count and a sum. The `le="+Inf"` bucket equals the count. Only record requests that matched a route (`req.route`), so labels stay bounded (Topic 8).

??? success "Reference solution"
    On the solutions branch: `git diff upstream/main upstream/solutions -- app/src/server.js`. The key parts are a `BUCKETS` list, an `observeDuration(method, route, seconds)` function called when each response finishes, and the `_bucket`, `_sum` and `_count` lines in `/metrics`.

```text title="Expected output after the fix"
Availability   SLI 100.000%   objective 99.500%   100.000% of the error budget left
Latency        SLI 100.000%   objective 99.000% under 250 ms   100.000% of the error budget left
```

Now make the budget move: restart the shop with `RECOMMENDATIONS_DELAY_MS=400`, call `/api/recommendations` a few hundred times (it takes 400 ms each), and run `npm run obs:slo` again. In your notebook: what should a team do when the latency budget runs out halfway through the month?

### Step 5 — A synthetic monitor (20 min)

```bash
npm run start:all                                  # terminal 1
npm run obs:synthetic                              # terminal 2
```

```text title="Expected output"
✔ shop is up                                34 ms
✔ search finds the k6 book                   3 ms
✔ a cart over 50 EUR ships free              7 ms
✔ an order can be placed and cancelled      41 ms

✔ Journey healthy.
```

Now break it the way production breaks: stop `start:all`, run only `npm start` (no inventory service), and run the monitor again:

```text title="Expected output"
✔ shop is up                                34 ms
✔ search finds the k6 book                   3 ms
✔ a cart over 50 EUR ships free              6 ms
✖ an order can be placed and cancelled      28 ms

✖ Journey FAILED: page someone, or open an incident.
```

The health check still says 200. The journey found the outage. Read `synthetic.mjs`: how are its requests labelled, and how does it clean up? Note in your notebook how you'd keep its orders out of Topic 7's sales report.

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 10
```

```text title="Expected output"
✔ Step 2-4 — Correlated logs, an honest readiness check, and a latency histogram
    one request id across services; /ready follows the inventory service; latency SLI measurable
✔ Step 5 — Notes: telemetry questions, correlation, health, SLOs and synthetic monitoring
    notebook/10/observability-notes.md

2/2 steps done for Topic 10: Production Quality and Observability
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Commit and push to your fork when you're done.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| The inventory service receives no id | `next()` is still called outside `requestContext.run(…)` | Call `next` *inside* `run`, so the whole request runs in the context |
| The id arrives, but a different one | The client reads the id at import time, not per request | Call `currentRequestId()` inside the request |
| `/ready` takes 3 s with a hanging inventory service | No timeout on the readiness call | `AbortSignal.timeout(500)` |
| `/ready` is 503 even when everything runs | The shop is pointed at the wrong inventory URL, or the token from Topic 9 blocks `/health` | `/health` must stay open; check `INVENTORY_URL` |
| `obs:slo`: "No API requests recorded yet" | A fresh shop with no traffic | Use `--warmup 300`, or click around the shop first |
| Counts in your own tests are higher than expected | Metrics live at module level, shared by every app in one process | Test with a route nothing else in that file uses, or compare before and after |
| The synthetic journey fails at "shop is up" | Nothing is running on `BASE_URL` | Start the shop, or set `BASE_URL` |
| Killing the inventory service also stopped the shop | `start:all` stops both when one exits | Run `npm start` alone for step 5's outage |
