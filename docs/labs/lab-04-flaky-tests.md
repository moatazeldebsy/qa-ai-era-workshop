# Lab 4 — Flaky tests

Reproduce a flaky test, prove what causes it, and fix it properly: not with retries, and not with a longer sleep.

By the end you'll have:

- **reproduced** a test that passes and fails on the same code
- **proved** the cause is timing, by controlling the server's delay
- seen **retries hide** the problem, without fixing it
- **fixed** it two ways: wait for the condition, and stub the dependency

**Time:** 25 min · **Tracks:** QA, Dev · **Module:** [2. AI-Powered Testing](../modules/02-ai-powered-testing.md)

## Prerequisites

- The [Quickstart](../start/setup.md) is done.
- **No app running on port 3210.** Playwright starts its own app for this lab, and if one is already running it reuses that one and ignores the delay settings below.

| File | What's in it |
|---|---|
| `labs/flaky/tests/recommendations.bad.spec.js` | Sleeps a fixed 700 ms, then asserts once |
| `labs/flaky/tests/recommendations.good.spec.js` | Two correct versions of the same check |
| `app/src/server.js` | `/api/recommendations` takes a random 200–1500 ms |

## 1. Reproduce it

```bash
npm run test:flaky        # each test, 10 times
```

```text title="Expected output (numbers vary)"
  6 failed
    [flaky] › recommendations.bad.spec.js › BAD: sleeps a fixed time, then asserts once
    ...
  24 passed
```

The two **good** tests pass all 20 runs. The **bad** one fails some of its 10 runs on unchanged code. That is what flaky means.

## 2. Prove the cause

Control the server's delay with an environment variable:

=== "Fast server"

    ```bash
    RECOMMENDATIONS_DELAY_MS=100 npx playwright test --project=flaky --repeat-each=10
    ```

    ```text title="Expected output"
      30 passed
    ```

=== "Slow server"

    ```bash
    RECOMMENDATIONS_DELAY_MS=1200 npx playwright test --project=flaky --repeat-each=10
    ```

    ```text title="Expected output"
      10 failed
      20 passed
    ```

    Every bad run fails; every good one still passes.

The outcome depends only on server timing. Nothing in the product changed between a pass and a fail.

## 3. See retries hide it

```bash
npx playwright test --project=flaky --repeat-each=10 --retries=2
```

Most runs now pass, and some are labelled **flaky** in the report. The suite looks green, but the test still doesn't check anything reliably.

!!! warning "Retries are a smoke alarm, not a fix"
    This repo's CI uses `retries: 1` so a flaky test doesn't block everyone, **and** the report labels it *flaky* so it stays visible. A retry policy that hides the label is how a suite rots.

## 4. Read the two fixes

=== "Wait for the condition"

    ```js title="labs/flaky/tests/recommendations.good.spec.js"
    await page.goto('/');
    await expect(page.locator('#recommendations li')).toHaveCount(2);
    ```

    A web-first assertion retries until the condition holds or the timeout expires. It is exactly as fast as the server, and never faster.

=== "Control the dependency"

    ```js title="labs/flaky/tests/recommendations.good.spec.js"
    await page.route('**/api/recommendations', (route) =>
      route.fulfill({ json: { books: [{ id: 9, title: 'Stubbed Book' }] } }),
    );
    await page.goto('/');
    await expect(page.locator('#recommendations li')).toHaveText(['Stubbed Book']);
    ```

    Stubbing the network makes the test independent of server timing altogether.

## 5. Fix the bad test yourself

Without copying the good file, fix `recommendations.bad.spec.js` and run step 1 again.

```text title="Expected output"
  30 passed
```

## Where AI helps

Paste the bad test, the failure message and the trace into an assistant and ask *"why is this flaky?"*. Models are good at spotting `waitForTimeout` and race conditions. They are worse at telling a real product bug (the API *sometimes* returns nothing) from a test bug, which is why step 2's experiment matters.

## The whole lab, end to end

```bash
npm run test:flaky                                                   # 1. reproduce
RECOMMENDATIONS_DELAY_MS=100  npx playwright test --project=flaky --repeat-each=10   # 2. fast: green
RECOMMENDATIONS_DELAY_MS=1200 npx playwright test --project=flaky --repeat-each=10   #    slow: red
npx playwright test --project=flaky --repeat-each=10 --retries=2     # 3. retries hide it
# 5. fix the bad test, then:
npm run test:flaky
```

## Stretch goals

- Add a CI step that runs **new or changed** tests with `--repeat-each=20` before they join the main suite. It catches flakiness at the door.
- Add a quarantine convention: tag flaky tests `@quarantine`, exclude them from the gate with `--grep-invert @quarantine`, and require an issue link for each.

## Debrief

1. How many flaky tests does your suite have? How do you know?
2. What does a flaky test cost, in time and in trust?
3. When is a retry legitimate?

## Next steps

<div class="grid cards" markdown>

-   **Lab 5 — Performance with k6**

    ---

    Timing as a requirement: thresholds that fail the build.

    [→ Lab 5](lab-05-performance-k6.md)

-   **Lab 7 — Quality gates**

    ---

    What a gate should do with a test that is flaky rather than failing.

    [→ Lab 7](lab-07-quality-gate.md)

</div>
