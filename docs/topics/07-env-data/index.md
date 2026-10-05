# Topic 7 — Test Environments and Test Data Management

*Where tests run, on what data, and how to make both repeatable, realistic and safe.*

Your pipeline runs tests. But a test is only as trustworthy as the environment around it and the data inside it. Shared data makes tests interfere. Hand-made data misses what real histories contain. Random data you can't regenerate hides failures. And copying real customer data into test environments creates a legal and security risk.

In this topic Quality Books runs in three kinds of environment: in-process, local, and a disposable Docker Compose environment. You'll make tests safe to run in parallel against a shared service and generate realistic, reproducible order histories, which expose a real bug in a new sales report. Then you'll fix a masking script that leaks personal data from a "production export".

<div class="topic-progress" data-topic="07"></div>

## What you'll be able to do

- Compare in-process, local, ephemeral and shared environments, and choose between them.
- Configure one codebase for many environments, keeping dangerous switches opt-in.
- Isolate test data so tests can run in parallel, even against a shared environment.
- Build seeded synthetic data generators that are valid by construction.
- Mask production data properly: keyed pseudonyms, scrubbed free text, joins preserved.
- Explain the privacy rules that apply to test data, and why "pseudonymised" isn't "anonymous".

## Before you start

Finish [Topic 6](../06-ci-cd/index.md) first. Step 1 optionally uses Docker. Everything else needs only Node.js.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: environments, parity, configuration, data strategies, generators, masking, privacy | ~2 h |
| [Lab](lab.md) | Compare environments, isolate shared data, find a bug with generated data, fix a leaky masking script | ~2.5 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 7     # your own branch for this topic
npm run learn:check 7     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- Shared-environment tests that pass 10 times out of 10 in parallel.
- A seeded order-history generator, and a report bug it found.
- A masked export that passes a PII scan and still works for testing.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 07**. When you've finished, post your notebook or your challenge solution there too.
