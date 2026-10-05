# Topic 6 · Lab

## 14. Hands-on lab: a faster pipeline and a gate you can trust

You'll run the course's checks as a pipeline and make it faster without losing anything, teach test impact analysis what imports can't see, close two holes in the quality gate, and watch the gate block a planted regression.

**Time:** 2 hours

!!! abstract "Same routine as before"
    `npm run learn:start 6` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 6` to see what's left · thinking work goes in `notebook/06/ci-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `labs/06-ci-cd/pipeline.mjs` | A small local CI runner: stages, dependencies, parallelism, timeline, critical path |
| `labs/06-ci-cd/pipeline.json` | The course's checks as a pipeline: every stage waits for the previous one |
| `labs/06-ci-cd/impact.mjs` | Test impact analysis by following imports |
| `labs/06-ci-cd/impact.config.json` | The test suites, and rules for dependencies imports can't see (empty) |
| `labs/06-ci-cd/quality-gate/` | The course's quality gate and its thresholds |
| `labs/06-ci-cd/tests/gate.test.js` | Tests for the gate itself; two TODO gaps |
| `.github/workflows/ci.yml` | This repo's real pipeline, for comparison |

### Step 0 — Baseline

```bash
npm run learn:start 6
mkdir -p notebook/06 && cp notebook/_templates/06/ci-notes.md notebook/06/
npm run ci:test
```

```text title="Expected output (summary)"
ℹ tests 5
ℹ pass 3
ℹ fail 0
ℹ todo 2
```

Two TODOs: two ways to get a ✅ from the gate without a ready release.

### Step 1 — From a list to a graph (30 min)

Run the pipeline as shipped:

```bash
npm run ci:pipeline
```

```text title="Expected output (end, times vary)"
Timeline (each █ ≈ 0.38s, concurrency 4)
unit           █ 0.3s
foundations     █ 0.5s
test-design      █████████████████ 6.6s
unit-mutation                     █████████ 3.4s
contract                                   █ 0.6s
browser                                      ████████████████████ 7.6s
gate                                                             █ 0.2s

Wall-clock time      19.2s
One after another    19.2s
Speed-up             1.00×
Critical path        unit → foundations → test-design → unit-mutation → contract → browser → gate (19.2s)
```

Every stage waits for the one before it, so the critical path is the whole pipeline. Note the numbers in your notebook.

**Your task:** edit the `needs` in `labs/06-ci-cd/pipeline.json` so the pipeline is as fast as it can be **without losing anything**:

- the fastest, most informative check still runs first, and nothing expensive starts if it fails
- the gate still sees all the evidence, and still gives a verdict when a test stage fails

Run it again and compare.

??? tip "Hint"
    Which stages need *another stage's output*, and which only need the code? Then check the gate's `always` setting: what should happen when `browser` fails?

??? success "Reference solution"
    `unit` first; `foundations`, `test-design`, `unit-mutation`, `contract` and `browser` each need only `unit`; `gate` needs all five, with `"always": true`.

    ```text title="Expected output (end, 4 cores; times vary)"
    unit           █ 0.3s
    foundations     ████ 0.7s
    contract        ████ 0.7s
    unit-mutation   █████████████████████████ 5.1s
    test-design     █████████████████████████████████████████████ 9.1s
    browser             ████████████████████████████████████████████ 9.0s
    gate                                                            █ 0.2s

    Wall-clock time      10.2s
    One after another    25.2s
    Speed-up             2.48×
    Critical path        unit → test-design → gate (9.6s)
    ```

Look closely at the stage times. Why did `test-design` take 9.1 s instead of 6.6 s? Try `PIPELINE_CONCURRENCY=2 npm run ci:pipeline`. Write down what you see.

### Step 2 — What imports can't see (30 min)

Impact analysis selects the suites a change could affect, by following each test's imports:

```bash
npm run ci:impact -- app/src/cart.js
```

```text title="Expected output"
▶ run   unit           app/src/cart.js (imported)
▶ run   foundations    app/src/cart.js (imported)
▶ run   test-design    app/src/cart.js (imported)
▶ run   unit-component app/src/cart.js (imported)
▶ run   contract       app/src/cart.js (imported)
· skip  api
· skip  e2e

5 of 7 suites selected.
```

Now ask it about the front end, where Topic 5's race condition lived:

```bash
npm run ci:impact -- app/public/app.js
```

```text title="Expected output (summary)"
0 of 7 suites selected.
```

**Your task:** before changing anything, try `app/src/server.js`, `services/inventory/src/app.js`, `package.json` and `docs/index.md`. For each one, write down which suites *should* run, and which the analysis selects. Then add `rules` to `labs/06-ci-cd/impact.config.json` until the selections are right.

??? tip "Hint"
    A rule looks like `{ "suite": "e2e", "when": ["app/**"], "why": "…" }`. The Playwright suites never import the app: `playwright.config.js` starts it, and the tests talk to it over HTTP.

??? success "Reference solution"
    ```json
    "rules": [
      { "suite": "e2e", "when": ["app/**", "services/**"], "why": "Playwright starts the app and drives it over HTTP; no imports to follow" },
      { "suite": "api", "when": ["app/**"], "why": "the API suite starts the shop through playwright.config.js" },
      { "suite": "e2e", "when": ["playwright.config.js", "labs/05-ui-e2e/e2e/**"], "why": "the suite's own config and helpers" },
      { "suite": "api", "when": ["playwright.config.js", "labs/04-integration-contract/api/**"], "why": "the suite's own config and helpers" },
      { "suite": "unit", "when": ["package.json", "package-lock.json"], "why": "dependencies changed: run everything" }
    ]
    ```

    …plus the `package.json` rule repeated for every suite. The last one is a design smell; the challenge asks you to improve it.

### Step 3 — Two ways to fool the gate (35 min)

The gate decides whether a release ships, so the lab tests it like any other code. `labs/06-ci-cd/tests/gate.test.js` builds folders of evidence and checks the verdicts. Read the two TODO tests, then see them for yourself:

```bash
node --test --test-reporter=spec labs/06-ci-cd/tests/gate.test.js
```

The gate says ✅ READY TO RELEASE when **37 of 38 tests are skipped**, and when the evidence is **older than the code** it's supposed to vouch for.

**Your task:** change `gate.mjs` and `gate.config.json` so that:

1. a run with more skipped tests than an agreed limit is blocked (choose the limit and justify it in your notebook)
2. any evidence file older than the newest file in `app/` or `services/` is reported as **stale** and blocks the release

Then turn both TODOs into real tests.

??? tip "Hint: freshness"
    `fs.statSync(file).mtimeMs` gives a file's modification time. Walk `app/` and `services/` for the newest one, and compare it with each evidence file's time when you read it.

??? success "Reference solution"
    In `gate.config.json`: `"tests": { "maxFailed": 0, "maxSkipped": 0, "required": true }` and `"freshness": { "codePaths": ["app", "services"] }`.

    In `gate.mjs`, find the newest modification time under the code paths, record every evidence file older than that in `readIfExists`, add `skipped <= maxSkipped` to the functional check, and add an **Evidence freshness** check that fails with `stale: … older than the code`. The full version is on the solutions branch: `git diff upstream/main upstream/solutions -- labs/06-ci-cd/quality-gate`.

Now run the gate on this machine's real evidence:

```bash
npm run gate
```

If you ran the performance or LLM labs on an earlier day, the gate now blocks: *"stale: llm-eval.json, k6-summary.json older than the code"*. It's right: those results describe code that no longer exists.

!!! warning "Freshness isn't provenance"
    A file can be newer than the code and still be the wrong evidence. Run `BASE_URL=… npx playwright test --project=e2e --project=api --reporter=list`: the `--reporter` flag *replaces* the configured reporters, so no new `junit.xml` is written, and the gate judges the *previous* run. Real pipelines solve this with provenance: evidence that records the commit, the run and the configuration that produced it, and a clean workspace per run. Note in your notebook how you'd add it. (This course fell into the same trap while it was being written: an early version of `pipeline.json` passed `--reporter=dot` to the browser stage, and the gate quietly judged an older `junit.xml` until the pipeline runner learned to start from an empty `test-results/`.)

### Step 4 — Watch it block a regression (15 min)

Now run the quality gate, with your stricter rules:

```bash
PORT=3300 BUG_MODE=cart npm start          # terminal 1: the shop with the free-shipping bug
BASE_URL=http://localhost:3300 npm test    # terminal 2
npm run gate
```

```text title="Expected output (excerpt)"
  5 failed
  33 passed (8.3s)
## Quality gate: ❌ BLOCKED

| Check | Result | Detail |
|---|---|---|
| Functional tests | ❌ fail | 33/38 passed, 5 failed, 0 skipped (max failed: 0, max skipped: 0) |
```

Stop the buggy shop, run `npm test` against the normal one, and run the gate again: the functional check goes green. Record which evidence blocked the release in your notebook.

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 6
```

```text title="Expected output"
✔ Step 1 — The pipeline runs fast checks first, the rest in parallel, then one verdict
    longest chain 3 stages; speed-up 2.48×
✔ Step 2 — Impact analysis selects the suites that imports cannot see
    front end, server, inventory, docs and dependency changes all select the right suites
✔ Step 3 — The gate blocks mostly-skipped runs and stale evidence
    skipped and stale evidence can no longer make a release "ready"
✔ Step 4 — Notes: pipeline, impact analysis, gate and the planted regression
    notebook/06/ci-notes.md

4/4 steps done for Topic 6: CI/CD and Continuous Testing
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Your speed-up depends on your machine's cores. Commit and push to your fork when you're done.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `✖ stage "x" needs unknown stage "y"` | A typo in `needs` | Use the exact `id` of another stage |
| `✖ dependency cycle: a → b → a` | Two stages need each other | A pipeline must be a DAG; remove one direction |
| `nothing can run` | A stage needs a stage that was skipped, and isn't `always` | Check the needs of the remaining stages |
| Speed-up barely above 1× | Only one or two CPU cores, or `PIPELINE_CONCURRENCY=1` | Expected on small machines; the checker judges the *structure*, not the speed |
| `browser` stage fails only in the parallel pipeline | Port 3210 already in use by another app | Stop it; parallel stages must not share ports |
| The gate says stale evidence right after `npm test` | You edited a file in `app/` after the run | Re-run the tests; that's the check working |
| Gate tests pass locally but evidence still looks stale in CI | Clock skew or restored caches with old timestamps | Never cache `test-results/`; produce evidence in the same job as the gate |
| `impact.mjs` selects nothing for any file | `impact.config.json` isn't valid JSON | Validate it: `node -e "JSON.parse(require('fs').readFileSync('labs/06-ci-cd/impact.config.json'))"` |
