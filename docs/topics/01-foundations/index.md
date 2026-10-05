# Topic 1 — QA Engineering Foundations

*What quality is, how we gain evidence about it, and how a QA engineer turns that evidence into decisions.*

Every later topic builds on the ideas here. Unit tests, contract tests, load tests and LLM evals are all different ways to do the same few things: **find out what could go wrong, decide how we'd notice, and produce evidence someone can act on.** This topic covers those few things.

We'll use one running example the whole way through: **the free-shipping rule in the Quality Books shop.** Orders pay 4.90 EUR shipping, and shipping is free once the order reaches 50 EUR. It sounds trivial. By the end of the lab you'll have found a real inconsistency in this repo, a boundary the test suite couldn't reach, and a planted bug that most of the tests can't see.

<div class="topic-progress" data-topic="01"></div>

## What you'll be able to do

- Explain what quality, QA, QC and testing are, and how they differ.
- Describe the quality feedback loop and the error → fault → failure chain.
- Use the ISO 25010 quality attributes to look beyond "does it work?".
- Choose and combine test oracles: specified, invariant and consistency.
- Build a risk register and prove each risk traces to a real check.
- Explain why a passing suite with high coverage can still miss a bug.

## Before you start

Nothing beyond the [setup](../../start/setup.md): Node.js and `npm install`. No browser, no API key, no testing experience.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: what quality engineering is and how it works | ~3 h |
| [Lab](lab.md) | Explore the shop, fix a real inconsistency, build a risk register, hunt a planted bug | ~90 min |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 1     # your own branch for this topic
npm run learn:check 1     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- A fixed inconsistency in the shop, kept honest by a regression test.
- A risk register that fails the build if it claims coverage that doesn't exist.
- An exploration charter and a defect report in your notebook.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 01**. When you've finished, post your notebook or your challenge solution there too.
