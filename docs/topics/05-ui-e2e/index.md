# Topic 5 — UI, Web, and End-to-End Testing

*How to check what the customer really sees, in a real browser, without building a slow and flaky test suite.*

Everything so far has tested the shop from the inside. This topic tests it the way a customer uses it: in Chromium, Firefox and WebKit, on phones and desktops, clicking faster than anyone planned for.

You'll rewrite brittle tests into resilient ones, and find two real bugs that only appear in multi-step journeys and real timing. You'll control the network to turn a "flaky" test into a reliable reproduction, fix a genuinely flaky test properly, and run Topic 2's pairwise matrix across three browser engines, where it finds something surprising.

<div class="topic-progress" data-topic="05"></div>

## What you'll be able to do

- Decide what belongs in an E2E suite, and what should be pushed down the pyramid.
- Write resilient tests with role-based locators, page objects and web-first assertions.
- Diagnose flaky tests, prove their cause, and fix them without sleeps or retries.
- Use network interception to stub, delay and reorder responses.
- Debug failures with Playwright's trace viewer.
- Cover browsers, screen sizes and locales economically with a pairwise matrix.

## Before you start

Finish [Topic 4](../04-integration-contract/index.md) first. You need Chromium (`npx playwright install chromium`). Firefox and WebKit are only needed for the optional full matrix in step 5 (`npx playwright install firefox webkit`, about 150 MB).

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: how browser automation works, locators, waiting, flakiness, network control, cross-browser | ~2.5 h |
| [Lab](lab.md) | Refactor brittle tests, fix a stuck cart and a race condition, cure a flaky test, run a browser matrix | ~3 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 5     # your own branch for this topic
npm run learn:check 5     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- Two journey bugs fixed in the shop's front end, guarded by deterministic tests.
- A flaky test fixed at the root, proven stable on a deliberately slow server.
- A cross-browser matrix generated from a pairwise model, and a finding from it.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions) under **Topic 05**. When you've finished, post your notebook or your challenge solution there too.
