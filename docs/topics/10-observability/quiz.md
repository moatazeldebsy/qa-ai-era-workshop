# Topic 10 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="10" markdown>

<div class="quiz-q" markdown>

**1. Which telemetry type is best for answering "where did the time go in this one slow order, across both services?"**

- [ ] Metrics
- [x] A distributed trace
- [ ] A liveness check
- [ ] A counter

<div class="quiz-why" markdown>
A trace records the timed spans of one request across services. Metrics aggregate many requests; logs describe events but don't show timing structure on their own.
</div>

</div>

<div class="quiz-q" markdown>

**2. Why can't the shop's request counters alone support "99% of requests under 250 ms"?**

- [ ] Counters reset too often
- [x] Counters record how many requests there were, not how long they took; a latency SLI needs a histogram (or timings)
- [ ] Prometheus can't store counters
- [ ] 250 ms is too small to measure

<div class="quiz-why" markdown>
A histogram with a 0.25 s bucket gives the share of requests under 250 ms directly: bucket ÷ count.
</div>

</div>

<div class="quiz-q" markdown>

**3. Every order fails because the inventory service is down, yet /health returns 200. What's missing?**

- [ ] A faster health check
- [x] A readiness check that reports whether the shop can do its job, so traffic is routed away
- [ ] More logging
- [ ] A liveness check that calls the inventory service

<div class="quiz-why" markdown>
Liveness says the process is alive; readiness says it can serve. Load balancers should route by readiness.
</div>

</div>

<div class="quiz-q" markdown>

**4. Why should a liveness check NOT depend on the inventory service?**

- [ ] It would be slower
- [x] A blip in the dependency would make the orchestrator restart every shop instance, which can turn a small problem into an outage
- [ ] Liveness checks can't make HTTP calls
- [ ] It should depend on it

<div class="quiz-why" markdown>
Restarting a healthy process doesn't fix its dependency. Keep liveness about the process itself.
</div>

</div>

<div class="quiz-q" markdown>

**5. An availability SLO is 99.5% over 30 days. What is the error budget?**

- [x] 0.5% of requests in the window may fail
- [ ] 99.5% of requests may fail
- [ ] 30 days of downtime
- [ ] Zero failures

<div class="quiz-why" markdown>
The budget is 1 − target. It's spent by incidents and risky changes, and makes reliability a shared, numeric decision.
</div>

</div>

<div class="quiz-q" markdown>

**6. What does a burn rate of 14.4 on a 30-day SLO mean?**

- [ ] 14.4% of the budget is left
- [x] The budget is being spent 14.4 times faster than sustainable: it would run out in about two days
- [ ] 14.4 errors per second
- [ ] The SLO is 14.4% too strict

<div class="quiz-why" markdown>
Burn rate 1 spends the budget exactly over the window. Multi-window burn-rate alerts page on fast burns that matter.
</div>

</div>

<div class="quiz-q" markdown>

**7. How did the lab make one failed order findable in both services' logs?**

- [ ] By logging every request body
- [x] By propagating the request id from the shop to the inventory service, which logs it
- [ ] By synchronising the clocks
- [ ] By merging both services into one

<div class="quiz-why" markdown>
Context propagation (here a request id, in production a W3C traceparent) is what lets logs and spans be joined across services.
</div>

</div>

<div class="quiz-q" markdown>

**8. A synthetic journey places a real order in production every minute. What must it do?**

- [ ] Use a real customer's account
- [x] Be clearly labelled, clean up after itself, and be excluded from business metrics such as the sales report
- [ ] Run only when an alert fires
- [ ] Avoid the checkout

<div class="quiz-why" markdown>
Synthetic traffic that pollutes revenue, stock or analytics creates new problems while detecting old ones.
</div>

</div>

<div class="quiz-q" markdown>

**9. Which alert is most useful at 3 a.m.?**

- [ ] CPU above 70% on one instance
- [x] The checkout's error budget is burning fast, or the synthetic order journey is failing
- [ ] A new deployment started
- [ ] Disk 40% full

<div class="quiz-why" markdown>
Alert on symptoms users feel, with a runbook. Causes go on dashboards for investigation.
</div>

</div>

<div class="quiz-q" markdown>

**10. Why should production logs avoid customer emails and payment details?**

- [ ] They make logs larger
- [x] Logs are copied widely and kept long, so they become a store of personal data with weaker protection
- [ ] JSON can't contain emails
- [ ] It's only a style preference

<div class="quiz-why" markdown>
Treat logs as a data store: minimise, mask, and restrict access.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **Tests tell you what was true when you checked. Observability tells you what is true now, and why.**
>
> Make the system explain itself: structured, correlated logs for what happened; bounded metrics and histograms for how much and how fast; traces for where the time went. Make health checks honest about whether users can be served. Define "reliable enough" as SLOs, spend the error budget deliberately, and watch the journeys that matter from the outside, because the inside can always look fine.

### 10 key things to remember

1. **Logs, metrics, traces:** detail, aggregation, path. Use each for what it's good at.
2. **Structured, correlated, safe logs:** JSON, one id per request across services, no secrets or personal data.
3. **Latency needs a histogram;** averages hide the tail.
4. **Liveness ≠ readiness.** Restart on one, route on the other.
5. **Health checks must not lie or hang:** short timeouts, critical dependencies only.
6. **SLIs measure what users feel;** SLOs are "just reliable enough".
7. **Error budgets turn reliability into a shared decision.**
8. **Alert on symptoms and burn rates,** with runbooks.
9. **Synthetic journeys find outages with no users,** and must be labelled and cleaned up.
10. **Watch from outside your blast radius.**

### Common mistakes

- Health checks that always say OK.
- Liveness checks that restart everything when a dependency blips.
- Unstructured logs, or logs without correlation ids.
- Average latency on every dashboard.
- Alerting on every cause, so on-call learns to ignore pages.
- 100% SLOs, or SLOs nobody uses for decisions.
- Synthetic orders counted as revenue.
- Personal data and tokens in logs.
- Monitoring that depends on the infrastructure it monitors.

### Hands-on challenge

**Trace it properly, and alert on it.**

1. Replace the hand-rolled request id with **OpenTelemetry**: install `@opentelemetry/sdk-node` and the HTTP and Express auto-instrumentations, export traces to the console (or to Jaeger with Docker), and show one order as a single trace with spans in both services.
2. Write a **burn-rate check**: extend `slo.mjs` to read `/metrics` twice, a minute apart, and compute the burn rate over that minute. Print `PAGE` when the availability burn rate is above 14.4.
3. Run `synthetic.mjs` every minute for 10 minutes against `start:all` (a shell loop, or GitHub Actions on a schedule in your fork). Stop the inventory service in the middle. How long until the synthetic journey failed (your MTTD)? How long until it passed again after a restart (your MTTR)?
4. **Stretch:** make the Topic 7 sales report ignore orders from `@synthetic.example`, with a test.

Share your burn-rate check in the discussions. There are many ways to choose the windows.

### What to learn next

**Topic 11 — Test Management and Quality Intelligence.** You now produce a lot of quality data: test results, flaky runs, coverage, mutation scores, incidents, SLOs. Topic 11 turns it into decisions: reporting that people read, trends that show where quality is going, flaky-test and failure analysis, and metrics such as DORA and defect escape rate, along with what each one hides.

Read before Topic 11 (optional):

- Google, [*The Site Reliability Workbook*](https://sre.google/workbook/table-of-contents/), chapters 2 (implementing SLOs) and 5 (alerting on SLOs)
- Charity Majors, Liz Fong-Jones and George Miranda, *Observability Engineering*
- [OpenTelemetry documentation: concepts](https://opentelemetry.io/docs/concepts/)

When you've finished the lab and the challenge, move on to [Topic 11](../index.md).
