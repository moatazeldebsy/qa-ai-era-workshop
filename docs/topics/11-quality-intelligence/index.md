# Topic 11 — Test Management and Quality Intelligence

*How do we turn test results, defects and incidents into decisions people trust?*

By now Quality Books produces a lot of quality data: unit, mutation, contract, browser, performance and security results; incidents; SLOs. On its own, data isn't insight. This topic is about collecting it over time, analysing it honestly, and reporting it so that someone decides something.

You'll compute delivery and quality metrics, and see how much their definitions change the story. You'll collect a real history of test runs and find that judging by the latest run misses a test that fails half the time. Then you'll discover that the retry policy in CI makes flakiness invisible in the JUnit reports most tools (including your Topic 6 quality gate) rely on.

<div class="topic-progress" data-topic="11"></div>

## What you'll be able to do

- Organise testing: inventory, ownership, traceability and runs.
- Choose, define and interpret metrics: DORA, MTTD, MTTR, escape rate, flaky rate, and what each hides.
- Collect test results over time and analyse them across runs.
- Tell flaky from failing, measure failure rates, and decide between fix, quarantine and delete.
- Know what standard formats (JUnit) can't express, and keep richer data when it matters.
- Report for an audience, and avoid Goodhart's law.

## Before you start

Finish [Topic 10](../10-observability/index.md) first. You need Chromium and Python 3.9+ (for the metrics script).

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: data pipeline, flakiness, formats, metrics and definitions, DORA, quarantine, reporting | ~2 h |
| [Lab](lab.md) | Question metric definitions, collect a run history, find flakiness, uncover what retries hide | ~2 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 11    # your own branch for this topic
npm run learn:check 11    # after each lab step: ✔ or what's missing
```

## What you'll come away with

- Metrics with stated definitions, and an example of how definitions move the numbers.
- A results analyser that judges flakiness from history and from retries.
- A report that ends in decisions: what to fix, quarantine or delete, and who owns it.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 11**. When you've finished, post your notebook or your challenge solution there too.
