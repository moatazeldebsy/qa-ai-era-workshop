# Topic 8 — Performance, Load, and Resilience Testing

*Is it fast enough, for enough people at once, and does it survive when something it depends on goes wrong?*

Functional tests run with one user on a healthy network. Production has thousands of users, and something, somewhere, is always slow or broken. This topic tests Quality Books under load and under failure.

You'll read latency percentiles from a k6 smoke test, then load-test the whole checkout, two services deep, and see a run that looks fast and is almost entirely errors. You'll put a fault-injecting proxy between the shop and the inventory service and find that one slow dependency makes every order hang. And you'll find a slow memory leak that only a soak test with odd traffic reveals.

<div class="topic-progress" data-topic="08"></div>

## What you'll be able to do

- Read and set latency percentiles, error rates and thresholds, and explain why averages mislead.
- Design load tests: workload model, open versus closed load, data, environment.
- Use smoke, load, stress, spike and soak tests for what each is good at.
- Inject faults (latency, errors) and test resilience patterns: timeouts, retries, circuit breakers, degradation.
- Apply Little's Law to explain why slow dependencies become outages.
- Spot unbounded growth, such as metric cardinality, that only shows up over time.

## Before you start

Finish [Topic 7](../07-env-data/index.md) first: the order load test needs its test-data API. Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (`brew install k6`, `winget install k6`, or use Codespaces).

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: percentiles, workload models, test types, Little's Law, resilience patterns, chaos engineering | ~2.5 h |
| [Lab](lab.md) | Read a smoke test, fix a misleading order load test, make the shop fail fast, find a soak-only leak | ~2.5 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 8     # your own branch for this topic
npm run learn:check 8     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- An order load test that sets up its own data and meets its thresholds.
- A shop that answers within a second when its dependency hangs, proven by a fault-injection test.
- Bounded metrics, and a soak-test habit for finding slow leaks.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 08**. When you've finished, post your notebook or your challenge solution there too.
