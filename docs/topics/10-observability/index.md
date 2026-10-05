# Topic 10 — Production Quality and Observability

*How do we know it works for real users, right now, and how quickly do we find out when it doesn't?*

Every test so far ran before release. This topic is about what happens after: logs, metrics and traces that let you understand a running system; health checks that tell the truth; SLOs and error budgets that turn "is it reliable enough?" into a number; and synthetic journeys that find a broken checkout before a customer does.

You'll find out what Quality Books' telemetry can and can't tell an on-call engineer, then fix three real gaps:

- logs from the shop and the inventory service that can't be joined
- a health check that stays green while every order fails
- metrics that can't measure a latency objective

Then you'll compute the shop's SLIs and error budget, and run a synthetic monitor that catches what the health check missed.

<div class="topic-progress" data-topic="10"></div>

## What you'll be able to do

- Use logs, metrics and traces for what each is good at, and make them structured, correlated and safe.
- Choose counters, gauges and histograms, and explain why latency needs a histogram.
- Separate liveness from readiness, and design checks that neither lie nor flap.
- Define SLIs and SLOs, compute error budgets and burn rates, and use them to make decisions.
- Run synthetic monitoring that's labelled, cleaned up and kept out of business data.
- Propagate context across services, the basis of distributed tracing.

## Before you start

Finish [Topic 9](../09-security-a11y/index.md) first. This topic uses the two-service setup (`npm run start:all`) and Topic 8's chaos proxy.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: the three pillars, metric types, health checks, SLOs, error budgets, synthetic and real-user monitoring | ~2 h |
| [Lab](lab.md) | Question the telemetry, correlate logs, add readiness, measure SLOs, run a synthetic monitor | ~2 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 10    # your own branch for this topic
npm run learn:check 10    # after each lab step: ✔ or what's missing
```

## What you'll come away with

- One request id across both services' logs.
- A readiness check that follows the inventory service, without hanging.
- A latency histogram, an SLO report with error budgets, and a synthetic journey monitor.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 10**. When you've finished, post your notebook or your challenge solution there too.
