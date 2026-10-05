# Topic 1 · Lab

## 14. Hands-on lab: from a requirement to evidence

You'll take one requirement, free shipping, through the whole quality loop: map quality attributes, explore, resolve a spec inconsistency, build a risk register with a working trace, and prove your tests would catch a planted bug.

**Time:** 90 min

!!! abstract "How the labs work"
    - **Your own branch.** `npm run learn:start 1` creates `topic-01` from the course's starting state. Every topic starts clean, so you can do them in any order and redo one any time.
    - **Try first, then reveal.** Each step gives you the task. Hints and the reference solution are folded away (▸); open them only when you're stuck or done.
    - **Check as you go.** `npm run learn:check 1` checks every step and tells you what's missing.
    - **Thinking work goes in your notebook.** Some steps ask for tables or explanations. Copy the template from `notebook/_templates/01/` into `notebook/01/` and replace every ✏️.

**Files:**

| File | What's in it |
|---|---|
| `labs/01-foundations/tests/oracles.test.js` | The same feature checked with three kinds of oracle |
| `labs/01-foundations/risk-register.json` | Seven Quality Books risks, scored, with their checks |
| `labs/01-foundations/risks.mjs` | Ranks the risks and proves each check really exists |
| `labs/01-foundations/bug-hunt.mjs` | Runs the oracles on correct and on buggy code, and lists which tests caught the bug |
| `notebook/_templates/01/` | Templates for your notes: quality attributes, charter, bug-hunt explanation |
| `labs/01-foundations/check.mjs` | What `npm run learn:check 1` checks |
| `app/src/cart.js` | The code under test, including the `shippingFor()` seam |

### Step 0 — Set up and get a baseline

```bash
npm install                 # once; Topic 1 needs no browser
npm run learn:start 1       # your branch for this topic
mkdir -p notebook/01
npm run foundations:test
```

```text title="Expected output (summary)"
ℹ tests 8
ℹ suites 3
ℹ pass 7
ℹ fail 0
ℹ todo 1
```

The **todo** is a known finding recorded as a test. Note it; you'll resolve it in step 3. Open `labs/01-foundations/tests/oracles.test.js` and read the three `describe` blocks. Each one checks the same feature with a different kind of oracle from section 4.

Then see where you stand:

```bash
npm run learn:check 1
```

```text title="Expected output (summary)"
0/5 steps done for Topic 1: QA Engineering Foundations
```

### Step 1 — Map the quality attributes (15 min)

```bash
cp notebook/_templates/01/quality-attributes.md notebook/01/
```

For each ISO 25010 characteristic in [section 4](concepts.md#4-main-components-and-concepts), write one sentence about what it means *for Quality Books*, and one way you'd get evidence for it. Then pick the three that matter most for a small online bookshop with an AI assistant, and justify the choice in one line each.

There's no single right answer. The goal is to see that "does the cart work?" is a small part of the quality question. Keep the sheet: Topic 14 comes back to it.

### Step 2 — Explore with a charter (20 min)

Copy the charter and start the shop:

```bash
cp notebook/_templates/01/charter.md notebook/01/
npm start                                   # http://localhost:3210
```

Follow the charter. Some probes to start with (in a second terminal):

```bash
# A 2 x 29.99 cart: 59.98 EUR, should ship free
curl -s localhost:3210/api/cart/price -H 'content-type: application/json' \
  -d '{"items":[{"bookId":1,"quantity":2}]}'

# Closest you can get just under 50: one copy of "Responsible AI Testing"
curl -s localhost:3210/api/cart/price -H 'content-type: application/json' \
  -d '{"items":[{"bookId":6,"quantity":1}]}'

# What does the assistant tell a customer?
curl -s localhost:3210/api/assistant -H 'content-type: application/json' \
  -d '{"question":"Is shipping free on a 50 EUR order?"}'

grep -n "subtotal is" app/openapi.yaml
```

```text title="Expected output"
{"lines":[...],"subtotal":59.98,"shipping":0,"total":59.98}
{"lines":[...],"subtotal":39.9,"shipping":4.9,"total":44.8}
{"answer":"Standard shipping takes 3-5 business days and is free for orders over 50 EUR.","mode":"mock"}
42:        Shipping is 4.90 EUR, free when the subtotal is 50 EUR or more.
```

Write down what you find in the charter's notes and findings tables. Aim for at least two findings before you open the box below.

??? tip "Hint"
    Compare what the three sources say happens at *exactly* 50.00 EUR. Then try to build a cart that costs exactly 50.00 EUR.

??? success "Check your findings"
    | # | Type | Finding |
    |---|---|---|
    | 1 | Question / spec bug | The assistant says "over 50 EUR"; the contract and code say "50 EUR or more". At exactly 50.00 they disagree. |
    | 2 | Testability | You can't build a cart that costs exactly 50.00 EUR, so the boundary can't be tested through the API or the UI. |
    | 3 | (Anything else you noticed) | e.g. how out-of-stock books behave, or the error for 11 copies |

Then stop the app (`Ctrl+C`), start it with the planted bug (`npm run start:bug-cart`), and repeat the first `curl`. Shipping is now `4.9` on a 59.98 EUR cart. Write a defect report for it in the charter using the format from section 4: title stating the impact, steps, expected, actual, evidence (the `x-request-id` header from `curl -i`), severity and priority. Stop the app when you're done.

### Step 3 — Resolve the inconsistency (15 min)

A consistency oracle tells you *that* sources disagree, not *which* one is right. That's a product decision. In a real team you'd ask the product owner. For this lab, the decision is: **50.00 EUR ships free**, because the contract, the code and the existing UI test (*"ships free once the subtotal reaches 50 EUR"*) already agree on it.

**Your task:** make the customer-facing policy agree with the code, and turn the TODO test in `labs/01-foundations/tests/oracles.test.js` into a real test that keeps them in agreement.

??? tip "Hint"
    The policy lives in `app/src/catalog.js`. Read the TODO test's assertion: it tells you the exact wording it expects. A node:test test becomes a TODO through its options object.

??? success "Reference solution"
    In `app/src/catalog.js`:

    ```js
    shipping: 'Standard shipping takes 3-5 business days and is free for orders of 50 EUR or more.',
    ```

    In `labs/01-foundations/tests/oracles.test.js`, remove the options object:

    ```js
    test('the customer-facing policy states the same threshold as the code', () => {
      assert.match(policies.shipping, new RegExp(`${FREE_SHIPPING_THRESHOLD} EUR or more`));
    });
    ```

    Or compare your work with the solutions branch: `git diff upstream/solutions -- app/src/catalog.js labs/01-foundations/tests`

Then run it:

    ```bash
    npm run foundations:test
    ```

    ```text title="Expected output (summary)"
    ℹ pass 8
    ℹ fail 0
    ℹ todo 0
    ```

The finding is now a **regression check**. If anyone edits the policy or the threshold on its own again, this test fails. That's the "regression check added" step of the defect lifecycle.

!!! tip "Why not just change the code to `>`?"
    That would also make the sources agree. It would also change what every existing customer gets at 50.00, break the API contract (a *breaking change* for any client relying on it, Topic 4), and contradict an existing E2E test. Consistency fixes should move the *least authoritative* source towards the *most authoritative* one.

### Step 4 — Build and prove the risk register (20 min)

```bash
npm run foundations:risks
```

```text title="Expected output"
Risk register — 7 risks, must-cover threshold 12

ID  L×I    Score  Checks  Status     Risk
R2  4×4    16     2       covered    The assistant tells a customer a price or book that does not exist
R1  3×4    12     3       covered    A customer is charged shipping on an order that should ship free
R3  4×3    12     2       covered    Someone makes the assistant reveal its instructions or act outside its role
R5  3×4    12     2       covered    A keyboard or screen-reader user cannot complete a purchase
R7  5×2    10     0       gap        The assistant and the checkout disagree about when shipping is free
R4  2×4    8      1       covered    A customer can order more copies than are in stock
R6  2×3    6      1       covered    Pricing slows down under normal traffic and customers abandon the cart

Gaps below the threshold (decide: accept, or add a check): R7

✔ Every risk at or above the threshold traces to a check that exists.
```

The script does more than sort. For every check it opens the named file and confirms the test title is really there. A risk register that points at tests that were renamed or deleted claims coverage that doesn't exist. That's worse than no register at all.

Now do three things in `labs/01-foundations/risk-register.json`:

1. **Close the gap.** R7 is exactly the inconsistency you fixed in step 3. Make the register say so. Re-run: R7 should be `covered`, and the gap line gone.

    ??? success "Reference solution"
        ```json
        "checks": [
          { "file": "labs/01-foundations/tests/oracles.test.js", "title": "the customer-facing policy states the same threshold as the code" }
        ]
        ```

2. **Break the trace on purpose.** Change R4's title to `"shows a clear error when asking for more than in stock"` (one word missing). Re-run. The script exits with code 1 and prints `R4: check not found`. Undo the change.

3. **Add a risk of your own** from your exploration in step 2: for example, *"The cart shows a stale total after an item goes out of stock"*. Score it honestly. If it scores 12 or more and has no checks, the script fails. Either add a check that exists, or argue the score down with your team. Both are legitimate outcomes; an undocumented decision isn't.

### Step 5 — Hunt the planted bug (20 min)

Does the suite actually catch bugs, or does it just run? Plant one and see.

```bash
npm run foundations:bug-hunt
```

```text title="Expected output"
Clean code:       8 passed, 0 failed
BUG_MODE=cart:    6 passed, 2 failed

Caught the bug (red on buggy code):
  ✔ a 2 x 29.99 cart (59.98 EUR) ships free
  ✔ every sellable cart obeys the pricing invariants

Blind to the bug (still green):
  · 49.99 EUR pays shipping
  · 50.00 EUR ships free (the agreed boundary)
  · 50.01 EUR ships free
  · no sellable cart prices at exactly 50.00 EUR (why shippingFor exists)
  · the API contract states the same threshold as the code
  · the customer-facing policy states the same threshold as the code

✔ Bug caught by 2 of 8 tests.
```

(If you skipped step 3 you'll see 7 tests instead of 8; the TODO isn't counted.)

Read the bug in `app/src/cart.js`: under `BUG_MODE=cart` the code passes *the most expensive single copy's price* to `shippingFor()` instead of the subtotal.

**Your task:** before reading on, explain each result in your notebook.

```bash
cp notebook/_templates/01/bug-hunt.md notebook/01/
```

??? success "Compare your explanation"
    - The **boundary tests** are blind because they call `shippingFor()` directly, and `shippingFor()` is still correct. The bug is in *what gets passed to it*. Unit tests on a seam don't test the wiring around the seam.
    - The **2 × 29.99 cart** catches it, because quantity 2 makes the subtotal (59.98) and the single-copy price (29.99) land on opposite sides of 50.
    - The **invariant sweep** catches it because it checks the rule on about 19,000 carts, so it doesn't depend on anyone guessing the triggering input.
    - The **consistency checks** are blind: the documents still agree with each other. This bug is in the behaviour, not in the spec.

This is the core idea of **mutation testing** (Topic 3): deliberately introduce bugs and measure how many your tests catch. Coverage can't tell you this. Run `node --test --experimental-test-coverage "labs/01-foundations/tests/*.test.js"` and `cart.js` shows about 88% line coverage, yet six of those eight tests can't see the bug.

**Then see the same bug at other levels** (optional, needs `npx playwright install chromium` for the E2E part):

```bash
PORT=3300 BUG_MODE=cart npm start                    # terminal 1
BASE_URL=http://localhost:3300 npm run test:api      # terminal 2: some cart rows fail
BASE_URL=http://localhost:3300 npm run test:e2e      # terminal 2: the free-shipping UI test fails
```

Same bug, three levels, very different feedback times. Note the run time of each and compare with the unit-level bug hunt.

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 1
```

```text title="Expected output"
✔ Step 1 — Map the quality attributes
    notebook/01/quality-attributes.md
✔ Step 2 — Explore with a charter and write a defect report
    notebook/01/charter.md
✔ Step 3 — Resolve the free-shipping inconsistency
    8 oracle tests pass, no TODO left
✔ Step 4 — Close the risk gap and add a risk of your own
    8 risks, every must-cover risk traced to a real check
✔ Step 5 — Hunt the planted bug and explain the results
    notebook/01/bug-hunt.md

5/5 steps done for Topic 1: QA Engineering Foundations
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Also run `npm run test:unit` to be sure you didn't break the app's own tests. Then commit your work (`git add -A && git commit -m "Topic 1 lab"`) and push it to your fork. Your fork's CI posts a progress table on every push.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module '.../labs/01-foundations/tests'` | Running `node --test` on a directory instead of a glob | Use `npm run foundations:test`, which passes `"labs/01-foundations/tests/*.test.js"` |
| `Cannot find module` for `cart.js` or `catalog.js` | Running from a subfolder | Run every command from the repo root |
| A `✖ failing tests:` list appears after a summary that says `fail 0` | Node 24 lists TODO tests there too, marked `# TODO` | Expected: TODO tests are reported but never fail the run. Only `fail` in the summary counts |
| The summary lines start with `#` instead of `ℹ` | Node 22 prints TAP when the output isn't a terminal | Same numbers, different format; Node 24 (from `.nvmrc`) matches these pages |
| Step 0 shows `todo 0` and 8 passed | Step 3 is already done (fine), or `policies.shipping` was edited earlier | Check `git diff app/src/catalog.js` |
| `learn:check`: `notebook/01/… still has N ✏️ placeholder(s)` | A placeholder is left somewhere in the page | Search the file for ✏️; every one needs your own words |
| `learn:start`: `You have uncommitted changes` | Work from another topic isn't committed | Commit it on that topic's branch, or `git stash` |
| Step 3 test fails with `The input did not match the regular expression` | Policy text not exactly `50 EUR or more` | Compare the string character by character; watch for "50EUR" or a non-breaking space |
| `foundations:risks`: `check not found` you didn't expect | A title in the register differs from the test title, or the file moved | Copy the title straight from the test file; it must appear in the file exactly as written, case and all |
| `foundations:risks`: `likelihood must be an integer from 1 to 5` | A score like `3.5` or `"3"` (a string) | Use whole numbers without quotes |
| JSON parse error from `risks.mjs` | Trailing comma or comment in `risk-register.json` | JSON allows neither; the `$comment` field is the workaround |
| Bug hunt: `The suite must pass on correct code first` | `BUG_MODE` is exported in your shell, or a test is broken | `unset BUG_MODE`, then fix the failing test the script names |
| Bug hunt: `The bug escaped` | You removed or weakened the two tests that catch it | Restore them from git (`git checkout labs/01-foundations/tests`) |
| `curl` → `Connection refused` | App not running, or on another port | `npm start`; check that the terminal says port 3210 |
| `EADDRINUSE` on `npm start` | Something is already on 3210 | Stop the other process, or `PORT=4000 npm start` and adjust the URLs |
| Assistant `curl` answer differs from the docs | You started with `ASSISTANT_MODE=buggy` or `claude` | Restart with plain `npm start` (mock mode) |
| Optional API/E2E step passes on buggy code | Playwright reused another app on port 3210 instead of the one on 3300 | Make sure `BASE_URL` is set in the same command |
