# Test management and quality intelligence notes

Topic 11. Reference answer (history numbers from one real batch of runs).

## Step 1 — Delivery and quality metrics

| Metric | Value | What it hides |
|---|---|---|
| MTTD (mean) | 34.8 min (median 4.5 min) | Two very different populations: automated detection in 3–4 minutes, customer reports in 97.5 |
| MTTR | 46.8 min from detection (81.7 from start) | The time customers suffered before anyone noticed |
| Change failure rate | 10.0% | Failures without a recorded incident, and incidents not linked to a deployment |
| Defect escape rate | 25.0% | Unreported production defects; severity (one escape can matter more than ten) |

What changed when I measured MTTR from the incident's start instead of its detection, and which definition I'd choose: it rose from 46.8 to 81.7 minutes, because slow detection now counts. I'd publish MTTR from start as the customer-facing number, with MTTD next to it, so detection and repair can be improved separately.

## Step 2 — History beats the latest run

What the first report said about the BAD test, and what 12 runs said: after the 12th run it said "Failing in the latest run: BAD…" and "Flaky tests: none detected". The history says it passed 5 times and failed 7 times on the same code: flaky, failing about 58% of the time.

Why "always failing" and "sometimes failing" need different actions: an always-failing test is a regression or a broken test, so stop and fix it before merging anything else. A sometimes-failing test erodes trust in every red build: quarantine it with an owner so the build is trustworthy again, then fix its cause (here a fixed sleep).

## Step 3 — Retries hide flakiness

What JUnit showed for a run where a test passed only on retry, and what Playwright's JSON showed: JUnit had `failures="0"`, a plain pass; the only trace was a `test-failed-1.png` attachment path. The JSON report said `"flaky": 1`, with the test's results `failed` then `passed`.

Why that matters for the quality gate from Topic 6: the gate reads `junit.xml`, so with CI's `retries: 1` it can never see flakiness. A suite can quietly become flakier every week while the gate stays green. The gate should read the runner's JSON (or another format that keeps retries) and set a flaky threshold.

## Step 4 — Decisions

The flaky test's failure rate, and what I'd do with it (fix, quarantine, delete), with an owner and a deadline: about 50–58% across my histories. Fix it this week: the cause is known (a 700 ms sleep before a single count) and the fix is one web-first assertion. Owner: whoever owns the recommendations widget. Until then, quarantine it so it reports without blocking.

What the slowest tests in the report have in common, and whether that cost is worth it: the two slowest (about 5.3 s each) are Topic 5's `test.fail()` journeys: known bugs whose assertions wait the full 5-second timeout before failing as expected. Worth it while the bugs are open, because they document real defects and will tell us when they're fixed, but it's a 10-second tax on every run, so the bugs should be fixed soon.

One metric I would NOT show on a team dashboard, and why: tests written per person. It invites trivial tests, says nothing about quality, and turns a learning tool into a performance review.
