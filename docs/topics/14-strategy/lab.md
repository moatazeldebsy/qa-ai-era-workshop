# Topic 14 · Lab

## 14. Hands-on lab: a strategy built on evidence

You'll generate a quality scorecard from the repository, find where the evidence doesn't fit the risks, write a short quality strategy for Quality Books, and turn it into a one-page update for leadership.

**Time:** 2.5 hours

!!! abstract "Same routine as before"
    `npm run learn:start 14` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 14` to see what's left · this topic's main output *is* your notebook: `notebook/14/strategy.md` and `notebook/14/leadership-update.md`.

**Files:**

| File | What's in it |
|---|---|
| `labs/14-strategy/scorecard.mjs` | Gathers live evidence: test portfolio, risk traceability and fit, fleet conformance, gate thresholds, production dependencies |
| `labs/01-foundations/risk-register.json` | The risk register from Topic 1 |
| `labs/14-strategy/tests/strategy.test.js` | Checks the scorecard, and one TODO finding |
| `notebook/_templates/14/` | The strategy and the leadership update templates |

### Step 0 — Baseline

```bash
npm run learn:start 14
mkdir -p notebook/14 && cp notebook/_templates/14/*.md notebook/14/
npm run strategy:test
```

```text title="Expected output (summary)"
ℹ tests 2
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ todo 1
```

### Step 1 — Read the evidence (25 min)

```bash
npm run strategy:scorecard
```

```text title="Expected output (from the course's starting state; yours reflects your branch)"
## 1. Test portfolio (static count of test() calls; a data-driven loop counts once)

Unit and component               74  ██████████████████████████████
Integration and contract         22  █████████
API (out of process)             10  ████
Browser E2E                      14  ██████
Accessibility                     3  █
Security                          4  ██
LLM evals and red team           22  █████████
Load scenarios (k6 scripts)       3  █

## 2. Risks and their evidence

R2   16  traced          The assistant tells a customer a price or book that does not exist
R1   12  traced          A customer is charged shipping on an order that should ship free
R3   12  traced          Someone makes the assistant reveal its instructions or act outside its role
R5   12  traced          A keyboard or screen-reader user cannot complete a purchase
R7   10  gap             The assistant and the checkout disagree about when shipping is free
R4    8  traced          A customer can order more copies than are in stock
R6    6  WRONG EVIDENCE  Pricing slows down under normal traffic and customers abandon the cart
  ⚠ R6: Performance efficiency risk needs a check that measures time; linked: cart: status 200

## 3. Platform standards across the fleet

shop         2/5 standards  ✖ security-headers ✖ json-404 ✖ json-client-errors
inventory    1/5 standards  ✖ request-id ✖ security-headers ✖ json-404 ✖ json-client-errors

## 4. Release gate

Functional tests: max failed 0, max skipped not limited, required true
LLM evals: min pass rate 1, required false · red team: required false
Performance: required false · evidence freshness checked: no

## 5. Production dependencies

Known-vulnerable production packages today: 0
```

The scorecard is also saved as `test-results/scorecard.md`. Read it as a leader would. **Your task:** before reading on, write down three things in it that would change your priorities.

??? success "Compare your reading"
    - **R6 has the wrong evidence.** A performance risk is traced to a check of the status code, which a slow cart passes too.
    - **R4 says "traced", but Topic 2 found it happening.** The linked UI test checks one error message for one cart; the duplicate-line oversell got past it. "Covered" isn't "protected": evidence has to be strong enough, not just present.
    - **The gate and the risks disagree.** R2 (16) is the highest risk, and its evidence (the LLM evals) is optional for release. So is the red team (R3, 12). A release can ship with no evidence about the riskiest feature.
    - **The portfolio's shape is healthy:** many fast unit and component tests, few browser tests. But accessibility and security are thin for a public shop.
    - **The fleet fails basic standards** on main (Topic 13), and **the gate doesn't limit skipped tests or check freshness** (Topic 6).

### Step 2 — Make the evidence fit the risk (15 min)

**Your task:** trace R6 to evidence that can actually detect slowness, and turn the TODO in `strategy.test.js` into a real test. The evidence already exists; it just isn't linked.

??? tip "Hint"
    Look at the `thresholds` in `labs/08-performance/k6/smoke.js`. The risk register only needs a title that appears in the file.

??? success "Reference solution"
    In `labs/01-foundations/risk-register.json`, R6's checks become:

    ```json
    "checks": [
      { "file": "labs/08-performance/k6/smoke.js", "title": "http_req_duration{endpoint:cart}" }
    ]
    ```

Run `npm run foundations:risks` to make sure the trace is real, and `npm run strategy:scorecard` to see R6 change to `traced`. Then, in your strategy notes, decide what to do about R4: which evidence would actually protect against overselling? (Topic 2 and Topic 4 each give an answer.)

### Step 3 — Write the strategy (60 min)

Fill in `notebook/14/strategy.md`, using the scorecard, your earlier notebooks and the Concepts page. Keep it short: a team should be able to read it in ten minutes.

Some guidance:

- **Goals:** pick three attributes and make each measurable. "Fast" isn't a goal; "99% of checkouts under 1 s, measured from production histograms" is (Topic 10).
- **Risks:** use the register, but challenge its scores with what you've learned. Is R6 really only a 6 for a shop?
- **Approach:** say what goes at each level, *and what you won't test, and why*.
- **Release decision:** derive gate rules from the risk ranking. What would you make required?
- **Investments:** exactly three, each with its evidence and a measure of success. Think in classes of problems (the Topic 13 baseline fixes many at once) rather than instances.

??? tip "Hint: what makes a strategy useful"
    For each sentence, ask: would a team behave differently because of it? "Quality is everyone's responsibility" changes nothing. "Every service adopts the platform baseline by the end of Q2; the fleet report is reviewed monthly" does.

### Step 4 — One page for leadership (25 min)

Fill in `notebook/14/leadership-update.md` for a director with five minutes: a headline with the decision you need, what's working (with numbers), what worries you (in customer and business terms), what you're asking for and what it buys, and the two or three numbers you'll report next time.

??? tip "Hint"
    Translate test language into business language. "R6 traced to a status check" becomes "we'd find out the checkout got slow from customers, not from our tests". "The gate doesn't require LLM evals" becomes "we could release a change to the AI assistant without checking whether it invents prices".

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 14
```

```text title="Expected output"
✔ Step 1-2 — The scorecard runs, and every risk is traced to evidence that can detect it
    scorecard built from live evidence; performance risks traced to timing evidence
✔ Step 3 — A quality strategy grounded in the evidence
    notebook/14/strategy.md
✔ Step 4 — A one-page update for leadership
    notebook/14/leadership-update.md

3/3 steps done for Topic 14: Quality Strategy and Engineering Leadership
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Commit and push to your fork. Then post your strategy in the discussions: compare priorities with other learners, and see how differently people weigh the same evidence.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `foundations:risks` says `check not found` for R6 | The title doesn't appear in `smoke.js` exactly | Copy `http_req_duration{endpoint:cart}` from the file |
| The scorecard shows different numbers | Your branch has fixes from earlier topics, or added tests | Expected: the scorecard reflects your repository |
| "Known-vulnerable production packages" shows `?` | `npm audit` couldn't reach the registry | Check your network; the rest of the scorecard is unaffected |
| `learn:check 14` says a notebook has placeholders | A ✏️ is left in a table cell | Search for ✏️ in both files |
