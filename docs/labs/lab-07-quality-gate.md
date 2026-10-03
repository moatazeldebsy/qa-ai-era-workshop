# Lab 7 — Quality gates in CI

Turn the evidence from Labs 1–6 into **one release decision**, see it block a planted regression, agree its thresholds as a team, and see the same gate run in GitHub Actions.

By the end you'll have:

- a **✅ READY TO RELEASE** verdict from real test, eval and performance evidence
- the same gate **❌ BLOCKING** a release with a pricing bug in it
- **changed a threshold**, and argued for it in front of the group
- read the **CI pipeline** that runs every lab and then the gate

**Time:** 35 min · **Tracks:** All · **Module:** [4. Process & Practices](../modules/04-process-and-practices.md)

## Prerequisites

- The [Quickstart](../getting-started.md) is done, and **k6** is installed.

| File | What's in it |
|---|---|
| `labs/quality-gate/gate.mjs` | Reads `test-results/` and decides; exit code 0 = ship, 1 = blocked |
| `labs/quality-gate/gate.config.json` | The thresholds: the team agreement, as code |
| `.github/workflows/ci.yml` | Runs every lab, then the gate |

## 1. Collect the evidence

```bash
npm test               # → test-results/junit.xml
npm start              # in another terminal, then:
npm run perf:smoke     # → test-results/k6-summary.json
npm run eval:llm       # → test-results/llm-eval.json
npm run eval:redteam   # → test-results/llm-redteam.json
```

## 2. Ask the gate

```bash
npm run gate
```

```text title="Expected output"
## Quality gate: ✅ READY TO RELEASE

| Check | Result | Detail |
|---|---|---|
| Functional tests | ✅ pass | 35/35 passed, 0 failed, 0 skipped (max failed: 0) |
| LLM evaluation | ✅ pass | 9/9 cases passed (100%, min 100%) |
| LLM red team | ✅ pass | 13/13 attacks resisted (100%, min 100%) |
| Performance | ✅ pass | books p95 2ms, cart p95 1ms, errors 0.00% |
```

## 3. Plant a regression

Run the functional tests against an app with the free-shipping bug:

```bash
PORT=3300 BUG_MODE=cart npm start                  # terminal 3
BASE_URL=http://localhost:3300 npm test            # terminal 2
npm run gate
```

```text title="Expected output"
## Quality gate: ❌ BLOCKED

| Check | Result | Detail |
|---|---|---|
| Functional tests | ❌ fail | 31/35 passed, 4 failed, 0 skipped (max failed: 0) |
| LLM evaluation | ✅ pass | 9/9 cases passed (100%, min 100%) |
| LLM red team | ✅ pass | 13/13 attacks resisted (100%, min 100%) |
| Performance | ✅ pass | books p95 2ms, cart p95 1ms, errors 0.00% |
```

Four tests fail: three API pricing rows and the E2E free-shipping journey, all pointing at the same rule. The gate exits **1**, so in CI the release never starts.

## 4. Negotiate the thresholds

This step is for the whole group, managers included. Open the config:

```json title="labs/quality-gate/gate.config.json"
{
  "tests": { "maxFailed": 0, "required": true },
  "llmEval": { "minPassRate": 1.0, "required": false },
  "llmRedteam": { "minPassRate": 1.0, "required": false },
  "performance": { "maxP95Ms": { "books": 200, "cart": 300 }, "maxErrorRate": 0.01, "required": false }
}
```

Argue it out. Should a 90% eval pass rate block a release? Should performance be `required`? Change the file, re-run `npm run gate`, and watch the decision change.

!!! note "Only `npm test` writes the gate's evidence"
    `test-results/junit.xml` comes from the main suite (E2E + API). Other runs (the flaky lab, the agent-tool tests, a single project) write `junit-<project>.xml` instead, so running them never swaps the gate's evidence for the wrong tests.

!!! tip "The gate is a team agreement written as code"
    Any change to `gate.config.json` should be a reviewed pull request, just like code. If the thresholds change silently, the gate means nothing.

## 5. See it in CI

```yaml title=".github/workflows/ci.yml (excerpt)"
- name: API and E2E tests
  id: functional
  continue-on-error: true      # a failing suite still reaches the gate
  run: npm test
# ... LLM evaluation, LLM red team, agent tools, performance smoke, metrics ...
- name: Quality gate
  run: npm run gate            # the only step that decides pass/fail
```

The steps follow the labs, fastest feedback first: doctor → unit → API & E2E → agent tools → LLM eval → red team → performance smoke → metrics → gate. On GitHub the gate's table appears in the run summary. Open the repo's **Actions** tab to see a real run, or push a branch with a failing test to see a blocked one.

## The whole lab, end to end

```bash
npm test                                      # 1. evidence
npm start &                                   #    (app for the next two)
npm run perf:smoke && npm run eval:llm && npm run eval:redteam
npm run gate                                  # 2. ✅ READY
PORT=3300 BUG_MODE=cart npm start &           # 3. plant the bug
BASE_URL=http://localhost:3300 npm test; npm run gate    # ❌ BLOCKED
# 4. edit gate.config.json, re-run the gate
```

## Stretch goals

- **Coverage check:** run the unit tests with `node --test --experimental-test-coverage` and gate on a minimum for `app/src/cart.js`.
- **Override with an audit trail:** a PR label `gate-override` that downgrades failures to warnings *and* records who applied it. Would you want this?
- **Relative gating:** compare against `main` (no regression) instead of using absolute thresholds.

## Debrief

1. Which threshold was hardest to agree on? Why?
2. What should happen when the gate blocks a release at 6 pm on a Friday?
3. What evidence is your current release decision based on?

## Next steps

<div class="grid cards" markdown>

-   **Lab 8 — Measuring what matters**

    ---

    From one release to the trend: MTTD, MTTR, DORA metrics and defect escape rate.

    [→ Lab 8](lab-08-metrics.md)

-   **Module 4 — Process & Practices**

    ---

    Shift-left, pipelines, risk-based strategy and incident learning.

    [→ Module 4](../modules/04-process-and-practices.md)

</div>
