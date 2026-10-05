# Topic 2 — Test Design Techniques

*Out of infinitely many possible tests, how to choose the few that are worth writing, and how to prove you chose well.*

In Topic 1 you picked 49.99, 50.00 and 50.01 by instinct, and the bug hunt showed that instinct isn't enough: six of eight tests were blind to a real bug. This topic replaces instinct with **techniques**: repeatable ways to turn a requirement into a small set of tests that catch a large share of the bugs.

The running examples are all in Quality Books:

- **The cart:** quantities, stock and shipping (`app/src/cart.js`)
- **Orders and refunds:** a new module for this topic with a lifecycle and a returns policy (`app/src/orders.js`)
- **The assistant's routing rules:** which answer wins when a question matches several rules (`app/src/assistant.js`)
- **The configurations the shop runs on:** browsers, screen sizes, languages and networks

The lab finds a **real bug** in this repo that every single-input technique misses, and ends with a mutation scorecard. It shows, in numbers, that **no single technique catches every bug.**

<div class="topic-progress" data-topic="02"></div>

## What you'll be able to do

- Derive tests with equivalence partitioning and boundary value analysis.
- Model combinations of conditions as decision tables and find the gaps.
- Test stateful behaviour with state-transition coverage, including invalid transitions.
- Cut a configuration matrix down with pairwise testing, and know what it misses.
- Write property-based and metamorphic tests, and read a shrunk counterexample.
- Use mutation testing to compare techniques and find blind spots.

## Before you start

Finish [Topic 1](../01-foundations/index.md) first; this topic uses its oracles and its mutation idea. Run `npm install` again if you set up before Topic 2: it adds fast-check.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: every major technique, when to use it, and what it misses | ~3 h |
| [Lab](lab.md) | Apply each technique to the shop, find and fix a real bug, score the techniques | ~2 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~1 h |

```bash
npm run learn:start 2     # your own branch for this topic
npm run learn:check 2     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- A real bug found, fixed and guarded by two different techniques.
- Partition, decision and state tables for the shop in your notebook.
- A mutation scorecard showing which technique catches which bug.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 02**. When you've finished, post your notebook or your challenge solution there too.
