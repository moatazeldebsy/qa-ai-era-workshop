# Topic 11 · Lab

## 14. Hands-on lab: from results to decisions

You'll question metric definitions with a month of delivery data, build a real history of test runs, teach a results analyser to see flakiness, and find out what CI's retry policy hides from JUnit-based tooling.

**Time:** 2 hours

!!! abstract "Same routine as before"
    `npm run learn:start 11` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 11` to see what's left · thinking work goes in `notebook/11/qi-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `labs/11-quality-intelligence/metrics/` | The metrics script and a month of deployments, incidents and defects |
| `labs/11-quality-intelligence/collect.mjs` | Runs the browser suites N times and keeps each run's JUnit and Playwright JSON |
| `labs/11-quality-intelligence/analyze.mjs` | Parses results and summarises tests across runs (a first version) |
| `labs/11-quality-intelligence/report.mjs` | A quality report from a folder of runs |
| `labs/11-quality-intelligence/tests/` | Tests for the analyser, with real fixtures from this repo; two TODO findings |

### Step 0 — Baseline

```bash
npm run learn:start 11
mkdir -p notebook/11 && cp notebook/_templates/11/qi-notes.md notebook/11/
npm run qi:test
```

```text title="Expected output (summary)"
ℹ tests 4
ℹ suites 2
ℹ pass 2
ℹ fail 0
ℹ todo 2
```

### Step 1 — Metrics, and what they hide (25 min)

Run the metrics script:

```bash
npm run metrics
```

```text title="Expected output"
MTTD (mean time to detect)          34.8 min
MTTR (mean time to resolve)         46.8 min
Deployment frequency                1.37 /day
Lead time for changes (median)       5.0 h
Change failure rate                10.0%
Defect escape rate                 25.0%

MTTD by detection source (min):
  alert                   3.0
  customer-report        97.5
  llm-eval-canary         3.5
  synthetic-monitor       4.0
```

An MTTD of 34.8 minutes sounds mediocre. The breakdown says something sharper: automated detection takes 3–4 minutes, and customer reports take 97.5.

**Your task:** open `labs/11-quality-intelligence/metrics/quality_metrics.py`. Change `mttd` to use the median, and `mttr` to measure from `started_at` instead of `detected_at`. Record the new numbers and what each definition is good for in your notebook, then decide which you'd publish.

??? success "Compare your numbers"
    MTTD: mean 34.8 min, median **4.5 min**. MTTR: from detection 46.8 min, from incident start **81.7 min**. Customers experience the second MTTR: they suffer from the start of the incident, not from when you noticed.

### Step 2 — History beats the latest run (35 min)

Build a history: run the browser suites 12 times on the same code.

```bash
npm run qi:collect -- 12
```

```text title="Expected output (varies)"
run  1  ✔ green  → labs/11-quality-intelligence/history/run-01.xml
run  2  ✔ green  → labs/11-quality-intelligence/history/run-02.xml
run  3  ✖ 1 failed  → labs/11-quality-intelligence/history/run-03.xml
…
run 12  ✖ 1 failed  → labs/11-quality-intelligence/history/run-12.xml
```

It takes a few minutes. Then ask for the report:

```bash
npm run qi:report
```

```text title="Expected output (excerpt; your runs differ)"
Runs:   ✔ ✔ ✖ ✖ ✖ ✔ ✖ ✖ ✖ ✔ ✔ ✖

Failing in the latest run:
  ✖ labs/05-ui-e2e/flaky/tests/recommendations.bad.spec.js › BAD: sleeps a fixed time, then asserts once

Flaky tests: none detected
```

The same test, on the same code, passed 5 times and failed 7. The report calls it "failing" today; tomorrow, if the last run is green, it'll say nothing at all.

**Your task:** make `summarize()` in `analyze.mjs` judge flakiness from the whole history: a test is flaky when it both passed and failed on the same code. Keep "failing" (fails every run) separate from "flaky" (sometimes fails). Turn the first TODO in `analyze.test.js` into a real test.

??? tip "Hint"
    `summarize` already counts `passed` and `failed` per test across runs. Which combination of the two means "different outcomes on the same code"?

??? success "Reference solution"
    ```js
    flaky: t.passed > 0 && t.failed > 0,
    ```

    `failureRate` (`failed / runs`) is already there, and the report sorts flaky tests by it.

### Step 3 — What retries hide (30 min)

This repo's CI runs Playwright with `retries: 1` (Topic 5). Collect a history the same way:

```bash
npm run qi:collect -- 12 --retries=1
```

Look at the JUnit and JSON files for a run that's green in the collector's output. In most, nothing happened. But compare the counts across all runs:

```bash
for f in labs/11-quality-intelligence/history/*.json; do node -e "const s=require('./$f').stats; console.log('$f', 'flaky', s.flaky, 'failed', s.unexpected)"; done
grep -o '<testsuites[^>]*>' labs/11-quality-intelligence/history/run-05.xml
```

```text title="Expected output (from one real batch; yours differs)"
…/run-05.json flaky 1 failed 0
<testsuites id="" name="" tests="17" failures="0" skipped="0" errors="0" time="…">
```

In that run the BAD test failed, was retried, and passed. Playwright's JSON report says `flaky: 1`. The JUnit file, which CI dashboards and the Topic 6 quality gate read, says `failures="0"`: the failure never happened. The only trace is a screenshot path named `test-failed-1.png`.

**Your task:** give `analyze.mjs` a `parsePlaywrightJson(text)` function that turns Playwright's JSON report into the same results as `parseJUnit`, with outcome `'flaky'` for tests that passed only on retry. Make `loadHistory` prefer each run's JSON when it exists, and make `summarize` count a retried pass as flakiness. Turn the second TODO into a real test.

??? tip "Hint"
    The report is a tree: `suites[]` (one per file) → nested `suites[]` (describe blocks) → `specs[]` → `tests[]`, each with a `status` (`expected`, `unexpected`, `flaky`, `skipped`) and every attempt in `results[]`. Build the id as `${spec.file} › ${describe titles…} › ${spec.title}` so it matches JUnit's `classname › name`.

??? success "Reference solution"
    On the solutions branch: `git diff upstream/main upstream/solutions -- labs/11-quality-intelligence/analyze.mjs`. The heart of it:

    ```js
    outcome: t.status === 'flaky' ? 'flaky' : t.status === 'skipped' ? 'skipped' : t.status === 'expected' ? 'passed' : 'failed',
    ```

    and in `summarize`, `flaky: (t.passed > 0 && t.failed > 0) || t.retriedPasses > 0`.

```text title="Expected report after steps 2 and 3 (excerpt)"
Flaky tests:
  ⚠  50% of 12 runs failed, 1 passed only on retry  labs/05-ui-e2e/flaky/tests/recommendations.bad.spec.js › BAD: sleeps a fixed time, then asserts once
```

In your notebook: what does this mean for the quality gate you built in Topic 6?

### Step 4 — Decide (15 min)

Read the full report. In your notebook:

1. The BAD test's failure rate. Fix, quarantine or delete? Who owns it, and by when?
2. The **slowest tests** section. What do the top two have in common? (Look at Topic 5's `journeys.spec.js`.) Is that cost worth paying?
3. One metric you would *not* put on a team dashboard, and why (section 4.5 of the Concepts).

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 11
```

```text title="Expected output"
✔ Step 2-3 — The analysis sees flakiness across runs and behind retries
    flaky ≠ failing; failure rates from history; retried passes counted
✔ Step 4 — Notes: metrics and what they hide, flakiness, retries and decisions
    notebook/11/qi-notes.md

2/2 steps done for Topic 11: Test Management and Quality Intelligence
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Commit and push to your fork when you're done. The `history/` folder isn't committed (it's in `.gitignore`); the fixtures in `tests/fixtures/` are.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Every collected run is green | You're on a branch where Topic 5's flaky test is fixed | That's progress! Use `git stash` or a branch from `main` to see the flaky history |
| `qi:collect` is slow | 12 runs × the browser suites | Use fewer runs (`-- 6`); flakiness may then not show |
| No run shows `flaky 1` with `--retries=1` | Retried passes are random; often both attempts fail or the first passes | Collect more runs; the fixture `retried-run.json` holds a real one |
| JSON and JUnit ids don't match | The describe-block titles are missing from your JSON ids | Walk nested `suites[]` and add each title |
| `python3: command not found` for `npm run metrics` | Python isn't installed | Install Python 3.9+, or read the script and compute by hand |
| The acceptance check "always failing is not flaky" fails | Flaky is computed as "failed at least once" | Flaky needs *both* outcomes on the same code |
