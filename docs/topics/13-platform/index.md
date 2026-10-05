# Topic 13 — QA Platform Engineering and Test Infrastructure

*How to give fifty teams good testing without fifty teams building it from scratch.*

Topics 1–12 built quality into one shop. This topic is about scale. A platform team turns good practice into **standards** (checked automatically across every service), a **paved road** (a shared baseline library, a service template, reusable CI) that makes the right thing the easy thing, and a **fleet view** that shows where every service stands.

You'll run a conformance kit across Quality Books' services and find that neither meets the basic standards, each failing in its own way. Then you'll implement the shared baseline once, move the inventory service onto it, and fix a real bug in the platform's own scaffolding tool. Internal tools are software too.

<div class="topic-progress" data-topic="13"></div>

## What you'll be able to do

- Explain internal developer platforms, paved roads and golden paths, and why they scale quality better than headcount.
- Turn standards into executable conformance checks, and report them across a fleet.
- Implement cross-cutting quality behaviour once, in a shared library, and drive adoption.
- Scaffold new services that start on the paved road, with reusable CI.
- Test and secure the platform's own tools.
- Run a platform as a product: adoption, developer experience, versioning, team structures.

## Before you start

Finish [Topic 12](../12-ai-in-qa/index.md) first. This topic touches ideas from Topics 4, 9 and 10 (errors, headers, request ids); you don't need those labs' fixes in your branch.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: platforms, standards as code, paved roads, reusable CI, team structures, DevEx | ~2 h |
| [Lab](lab.md) | Run the fleet report, build the baseline, migrate a service, fix the scaffolder, create a new service | ~2 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 13    # your own branch for this topic
npm run learn:check 13    # after each lab step: ✔ or what's missing
```

## What you'll come away with

- A conformance kit and a fleet report that answer "does every service do X?" in seconds.
- A baseline library that fixes cross-cutting problems once, for every service that adopts it.
- A scaffolder that creates conforming services, with CI, and can't be pointed anywhere it shouldn't.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 13**. When you've finished, post your notebook or your challenge solution there too.
