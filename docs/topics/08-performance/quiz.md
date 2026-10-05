# Topic 8 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="08" markdown>

<div class="quiz-q" markdown>

**1. Ten requests take 10 ms and one takes 2,000 ms. Why is the average (about 191 ms) a poor summary?**

- [ ] It's too low
- [x] It describes nobody's experience: most users saw 10 ms and one waited 2 s; percentiles show the tail
- [ ] Averages can't be computed for latency
- [ ] It's exactly right

<div class="quiz-why" markdown>
Latency distributions have long tails. p95 and p99 describe what the slowest users experience, which is what drives complaints and timeouts.
</div>

</div>

<div class="quiz-q" markdown>

**2. A load test reports p95 = 4 ms and an error rate of 97%. What's the most likely story?**

- [ ] The system is very fast
- [x] Most requests failed quickly, so the latency of errors made the numbers look excellent
- [ ] The load generator is broken
- [ ] Percentiles are wrong at high load

<div class="quiz-why" markdown>
Errors are often the fastest responses. Always pair latency with error-rate thresholds and content checks.
</div>

</div>

<div class="quiz-q" markdown>

**3. Why does an open (arrival-rate) workload model reveal overload that a closed model hides?**

- [ ] It sends larger requests
- [x] New requests keep arriving at the set rate even when the server slows, as real traffic does; closed-model users wait and send less
- [ ] It uses more virtual users
- [ ] It ignores errors

<div class="quiz-why" markdown>
In a closed model, a slow server throttles its own load. Real users don't coordinate, so queues grow and the knee appears.
</div>

</div>

<div class="quiz-q" markdown>

**4. By Little's Law, if 20 orders per second each wait 30 s on a slow dependency, roughly how many are in flight at once?**

- [ ] 20
- [ ] 30
- [x] 600
- [ ] 50

<div class="quiz-why" markdown>
Concurrency = throughput × latency = 20 × 30 = 600 waiting requests, each holding memory and connections. That's how a slow dependency becomes an outage.
</div>

</div>

<div class="quiz-q" markdown>

**5. Why did the lab add a timeout to the inventory client rather than a retry?**

- [ ] Retries are slower to write
- [x] Reserving stock isn't idempotent: a blind retry could hold copies twice, and retries add load when the dependency is already struggling
- [ ] Timeouts are always better than retries
- [ ] k6 doesn't support retries

<div class="quiz-why" markdown>
Retries need idempotency (or idempotency keys), backoff with jitter and a budget. A timeout first stops the bleeding.
</div>

</div>

<div class="quiz-q" markdown>

**6. How should you choose a timeout value?**

- [ ] As short as possible
- [ ] As long as possible, so nothing fails
- [x] From the dependency's real latency distribution (somewhat above its p99) and the caller's own time budget
- [ ] Always 30 seconds

<div class="quiz-why" markdown>
Too short fails normal calls; too long lets slow calls pile up. The lab checks both: 2 s must fail fast, 300 ms must still work.
</div>

</div>

<div class="quiz-q" markdown>

**7. Why are metrics labelled with raw URLs a problem?**

- [ ] URLs are too long to store
- [x] Every distinct value creates a new time series held in memory and billed by monitoring: attackers and scanners can grow it without limit
- [ ] Prometheus can't parse slashes
- [ ] It only matters for 404s

<div class="quiz-why" markdown>
Labels must have bounded values: route patterns, status codes, methods. Unbounded labels are a memory leak and a cost explosion.
</div>

</div>

<div class="quiz-q" markdown>

**8. Which test type is most likely to find a slow memory leak?**

- [ ] A smoke test
- [ ] A spike test
- [x] A soak (endurance) test at normal load for hours
- [ ] A unit test

<div class="quiz-why" markdown>
Leaks and unbounded growth need time to show. Short tests at any load usually miss them.
</div>

</div>

<div class="quiz-q" markdown>

**9. What's the main purpose of a circuit breaker?**

- [ ] To retry failed calls faster
- [x] After repeated failures, fail immediately for a while instead of waiting on a dependency that's down, then probe to see if it recovered
- [ ] To encrypt traffic
- [ ] To balance load between instances

<div class="quiz-why" markdown>
It saves time and threads during an outage and gives the dependency room to recover. It complements timeouts; it doesn't replace them.
</div>

</div>

<div class="quiz-q" markdown>

**10. Before running a load test against a shared environment or a third-party API, what should you do?**

- [ ] Nothing: load tests are harmless
- [x] Get permission, notify operations, and use sandboxes for third parties: a load test is indistinguishable from an attack
- [ ] Run it at night without telling anyone
- [ ] Disable all monitoring

<div class="quiz-why" markdown>
Unannounced load can trigger incident response, block your IPs or breach terms of service. Treat it like any other change to shared systems.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **Latency is a distribution, load is arrivals, and every dependency will eventually be slow.**
>
> Describe performance with percentiles and error rates, never averages alone. Generate load the way real traffic arrives, with data that lasts the whole test. Assume every call can hang or fail, and decide in advance what happens then: timeouts first, then careful retries, breakers and degradation. And remember that some failures are about *time*, not load: watch what grows.

### 10 key things to remember

1. **Percentiles, per endpoint,** plus error rate and content checks.
2. **Fast errors flatter latency.** Read latency together with success.
3. **Open models show overload;** closed models hide it.
4. **Load tests need data** sized for the whole run (Topic 7).
5. **Thresholds turn load tests into CI checks,** and they come from SLOs.
6. **Little's Law:** slow dependencies become concurrency, and then outages.
7. **Every remote call needs a timeout,** chosen from real latency and your own budget.
8. **Retry only what's idempotent,** with backoff, jitter and a budget.
9. **Inject faults deliberately** (latency, errors, kills) and check the steady state holds.
10. **Bound everything that grows:** caches, queues, metric labels.

### Common mistakes

- Reporting the average, or one number for every endpoint.
- Load tests without error-rate thresholds or content checks.
- Testing on a laptop and quoting the numbers as capacity.
- Closed-model load only.
- No timeouts, or the same huge default everywhere.
- Retrying non-idempotent operations.
- Treating chaos as random breakage instead of a controlled experiment.
- Unbounded labels in metrics and logs.
- Load testing systems you don't own without permission.

### Hands-on challenge

**Make the checkout resilient, and prove it.**

1. Add a **circuit breaker** to the inventory client: after 5 consecutive failures, fail immediately for 10 seconds, then let one call through to probe. Inject a 100% failure rate with the chaos proxy and show (in a test) that the shop stops calling the inventory service while the breaker is open.
2. Make the recommendations widget **degrade gracefully**: if `/api/recommendations` takes longer than 1 s, show the AI-tagged books from the catalogue instead. Write a Playwright test (Topic 5) that delays the route and checks the fallback.
3. Write `labs/08-performance/k6/spike.js`: 5 orders per second, jumping to 100 for 10 s, then back. Does the shop recover? What would make it recover faster?
4. **Stretch:** add idempotency keys to `POST /reservations` (a client-chosen key; a repeat with the same key returns the original reservation). Then a retry becomes safe. Prove it with a test that retries after a timeout.

Share your circuit-breaker test in the discussions. Testing time-based behaviour without sleeping is the interesting part.

### What to learn next

**Topic 9 — Security, Accessibility, and Compatibility Testing.** Fast and resilient isn't enough: it must also be safe, usable by everyone, and work everywhere. Topic 9 covers security testing (dependency scanning, static analysis, abuse cases), accessibility beyond automated scans, and compatibility across browsers and devices.

Read before Topic 9 (optional):

- Google, [*Site Reliability Engineering*](https://sre.google/sre-book/table-of-contents/), chapters 6 (monitoring) and 22 (cascading failures)
- Marc Brooker (AWS), [*Exponential Backoff and Jitter*](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- k6 documentation, [*Scenarios and executors*](https://grafana.com/docs/k6/latest/using-k6/scenarios/)

When you've finished the lab and the challenge, move on to [Topic 9](../index.md).
