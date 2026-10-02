# Lab 7 — Quality gates in CI

**Time:** 35 min · **Tracks:** All · **Module:** [4. Process & Practices](../modules/04-process-and-practices.md)

## Goal

Turn the evidence from Labs 1-6 into **one release decision**, then see how the same gate runs in GitHub Actions.

## Files

- `labs/quality-gate/gate.mjs`: reads `test-results/` and decides
- `labs/quality-gate/gate.config.json`: the thresholds, i.e. the team agreement
- `.github/workflows/ci.yml`: the pipeline that runs every lab and then the gate

## Steps

**1. Collect the evidence** (app running via `npm start` for the last two):

```bash
npm test               # writes test-results/junit.xml
npm run perf:smoke     # writes test-results/k6-summary.json
npm run eval:llm       # writes test-results/llm-eval.json
```

**2. Ask the gate.**

```bash
npm run gate
```

```text
## Quality gate: ✅ READY TO RELEASE

| Check | Result | Detail |
|---|---|---|
| Functional tests | ✅ pass | 33/33 passed, 0 failed, 0 skipped (max failed: 0) |
| LLM evaluation | ✅ pass | 9/9 cases passed (100%, min 100%) |
| Performance | ✅ pass | books p95 2ms, cart p95 1ms, errors 0.00% |
```

**3. Plant a regression.** Restart the app with the pricing bug and re-run the functional tests against it:

```bash
PORT=3300 BUG_MODE=cart npm start                 # terminal 1
BASE_URL=http://localhost:3300 npm test           # terminal 2
npm run gate
```

The gate is now **BLOCKED**: four tests fail (three API pricing rows and the E2E free-shipping journey), all pointing at the same rule. The exit code is 1, so in CI the release job never starts.

**4. Negotiate the thresholds.** This step is for the whole group, managers included. Open `gate.config.json`:

```json
"llmEval": { "minPassRate": 1.0, "required": false }
```

Debate it: should a 90% eval pass rate block a release? Should performance be `required`? Change the file, re-run the gate, see the decision change. **The gate is a team agreement written as code.** Any change to it should be a reviewed pull request.

**5. See it in CI.** Open `.github/workflows/ci.yml`. Its steps mirror the labs: unit → API & E2E → LLM eval → performance smoke → metrics → gate. Evidence steps are `continue-on-error`, so a failing suite still reaches the gate, and the gate fails the job. In GitHub, the gate writes its table to the run summary. Push a branch with a failing test to see a blocked run.

## Stretch goals

- Add a **coverage** check: run unit tests with `node --test --experimental-test-coverage` and gate on a minimum for `app/src/cart.js`.
- Add an **override** mechanism: a PR label `gate-override` that downgrades failures to warnings *and* records who applied it. Discuss whether you'd want this.
- Make the gate **compare to main** (no regression) instead of using absolute thresholds.

## Debrief

1. Which threshold was hardest to agree on? Why?
2. What should happen when the gate blocks a release at 6 pm on a Friday?
3. What evidence is your current release decision based on?
