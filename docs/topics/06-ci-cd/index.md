# Topic 6 — CI/CD and Continuous Testing

*How testing runs on every change, how fast it can be, and how its evidence becomes one trustworthy release decision.*

You now have unit tests, mutation tests, API and contract tests, and browser tests. On their own, they're just commands. This topic turns them into a **pipeline**: in what order they run, what can run at the same time, which ones a given change actually needs, and how their results become a *go* or *no go*.

You'll run the course's own checks through a small local pipeline runner and make it 2–3× faster by modelling real dependencies. You'll build test impact analysis and find its blind spot. Then you'll make the workshop's quality gate trustworthy: today it can be fooled by skipped tests and stale results.

<div class="topic-progress" data-topic="06"></div>

## What you'll be able to do

- Explain CI, continuous delivery, continuous deployment and continuous testing, and how they differ.
- Design a pipeline as a dependency graph: fast feedback first, parallel where possible, one verdict at the end.
- Find a pipeline's critical path and know what parallelism can and can't buy.
- Use test impact analysis, and know what a static dependency graph can't see.
- Build a quality gate that resists skipped tests and stale evidence.
- Connect deployment strategies (canary, feature flags, staged rollouts) to testing.

## Before you start

Finish [Topic 5](../05-ui-e2e/index.md) first: the pipeline runs every lab so far. You need Chromium for the browser stage.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: pipelines as graphs, tiers, test selection, gates, deployment strategies, pipeline security | ~2 h |
| [Lab](lab.md) | Speed up a pipeline, build impact rules, harden a quality gate, watch it block a regression | ~2 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 6     # your own branch for this topic
npm run learn:check 6     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- A pipeline definition that's measurably faster, with its critical path identified.
- Impact rules that select the right suites for front-end, server, service, docs and dependency changes.
- A quality gate that can't be turned green by skipping tests or reusing old results.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 06**. When you've finished, post your notebook or your challenge solution there too.
