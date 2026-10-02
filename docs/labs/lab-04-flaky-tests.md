# Lab 4 — Flaky tests

**Time:** 25 min · **Tracks:** QA, Dev · **Module:** [2. AI-Powered Testing](../modules/02-ai-powered-testing.md)

## Goal

Reproduce a flaky test, prove the cause, and fix it properly: not with retries, and not with a longer sleep.

## Files

- `labs/flaky/tests/recommendations.bad.spec.js`: sleeps a fixed 700 ms, then asserts once
- `labs/flaky/tests/recommendations.good.spec.js`: two correct fixes
- `app/src/server.js`: `/api/recommendations` takes a random 200-1500 ms

## Steps

**1. Reproduce.** Run the flaky project ten times:

```bash
npm run test:flaky
```

The *good* tests pass every time. The *bad* one fails on some runs and passes on others, with the same code. That is the definition of flaky.

**2. Prove the cause.** Make the server fast and deterministic:

```bash
RECOMMENDATIONS_DELAY_MS=100 npx playwright test --project=flaky --repeat-each=10
```

All green. Now slow it down: `RECOMMENDATIONS_DELAY_MS=1200` makes the bad test fail every time. You've shown the failure depends only on timing.

??? note "Why this works (and when it doesn't)"
    Playwright's `webServer` passes your environment to the app it starts, and the server reads `RECOMMENDATIONS_DELAY_MS`. If you already have `npm start` running on port 3210, Playwright **reuses** that server and the variable has no effect. Stop it first.

**3. See retries hide it.** Run with retries:

```bash
npx playwright test --project=flaky --repeat-each=10 --retries=2
```

Mostly "passed", some marked **flaky**. The suite is green, but the test still checks nothing reliably. In CI this config uses `retries: 1` *and* the report flags flaky tests, so they're visible, not hidden.

**4. Read both fixes** in `recommendations.good.spec.js`:

- **Wait for the condition**: `await expect(locator).toHaveCount(2)` retries until true or timeout.
- **Control the dependency**: `page.route` stubs the slow endpoint, so the test doesn't depend on its timing at all.

**5. Fix the bad test yourself** without copying the good file, then run step 1 again.

## Where AI helps

Paste the bad test, the failure message and the trace into an assistant and ask *"why is this flaky?"*. Models are good at spotting `waitForTimeout` and race conditions. They are less reliable at telling a real product bug (the API *sometimes* returns nothing) from a test bug, which is why step 2's experiment matters.

## Stretch goals

- Add a CI step that runs **new or changed** tests with `--repeat-each=20` before they're allowed into the main suite. This catches flakiness at the door.
- Write a quarantine convention: tag flaky tests with `@quarantine`, exclude them from the gate with `--grep-invert @quarantine`, and require an issue link for each.

## Debrief

1. How many flaky tests does your suite have? How do you know?
2. What does a flaky test cost? Think about time *and* trust.
3. When is a retry legitimate?
