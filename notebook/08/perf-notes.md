# Performance, load and resilience notes

Topic 8. Reference answer (numbers from a laptop).

## Step 1 — Reading a load test

From the smoke test: books p95 2.9 ms, cart p95 1.3 ms, error rate 0.00%.

Why a p95 (or p99) matters more than the average: the average blends fast and slow requests into a number nobody experienced. p95 says what the slowest 5% of users wait at least as long as, and those are the people who complain, retry or leave. A page that makes many calls hits the tail on most page views.

## Step 2 — The order load test

What the first run reported for errors and for p95 latency, and why the latency looked so good: 97% failed requests, p95 about 4.6 ms. After 12 orders book 1 was sold out, and every later order got a 409 in about a millisecond: fast errors made the latency look excellent.

How I gave the load test the data it needed, and why setup() is the right place: setup() runs once before any virtual user starts, so it PUTs 100,000 copies of book 1 through the test-data API. Doing it per iteration would add load that isn't customer traffic; doing it outside the script means the test only works if someone remembers.

## Step 3 — A slow dependency

What happened to an order when the inventory service took 3 s, before my fix: it took 3 s and then succeeded. With 30 s it would take 30 s. By Little's Law, 20 orders/s × 30 s = 600 orders waiting at once.

The timeout I chose, and how I decided (too short? too long?): 1 s. The inventory service normally answers in a few milliseconds, so 1 s leaves lots of headroom; a 300 ms answer still succeeds, and a user still gets an answer within about a second when it hangs.

What a retry would add here, and what could go wrong if the reservation call were retried blindly: it would hide brief glitches, but a reservation that actually succeeded after we gave up would be made twice, holding twice the stock. Retrying needs an idempotency key first, and backoff with jitter so retries don't pile onto a struggling service.

## Step 4 — The soak finding

Why one metric series per unknown URL is a memory leak and a cost problem: each series lives in the shop's memory for as long as the process runs and is sent on every scrape. Scanners request endless unique URLs, so memory and the monitoring bill grow without limit, slowly enough that no short test notices.

## Stretch — The knee

Where the stress test started to fail on my machine (requests per second), and what gave out first: it didn't. The ramp reached 600 requests per second with 0% errors and a p95 under 1 ms (21,299 requests, 50 virtual users). `GET /api/books` returns a small in-memory list, so a laptop can't find its knee this way; the load generator and the server share the same CPUs, so the generator may saturate first. To find a real knee I'd load-test the order path (two services and a payment step) from a separate machine, and raise the rate until p95 or errors break the thresholds.
