# Performance, load and resilience notes

Topic 8. Replace every ✏️.

## Step 1 — Reading a load test

From the smoke test: books p95 ✏️ ms, cart p95 ✏️ ms, error rate ✏️

Why a p95 (or p99) matters more than the average: ✏️

## Step 2 — The order load test

What the first run reported for errors and for p95 latency, and why the latency looked so good: ✏️

How I gave the load test the data it needed, and why setup() is the right place: ✏️

## Step 3 — A slow dependency

What happened to an order when the inventory service took 3 s, before my fix: ✏️

The timeout I chose, and how I decided (too short? too long?): ✏️

What a retry would add here, and what could go wrong if the reservation call were retried blindly: ✏️

## Step 4 — The soak finding

Why one metric series per unknown URL is a memory leak and a cost problem: ✏️

## Stretch — The knee

Where the stress test started to fail on my machine (requests per second), and what gave out first: ✏️
