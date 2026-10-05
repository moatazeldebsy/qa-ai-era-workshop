# Topic 2 · Lab

## 14. Hands-on lab: design tests that find real bugs

You'll apply each technique to Quality Books, find and fix a real bug, generate a configuration matrix, and score your techniques with mutation testing.

**Time:** 2 hours

!!! abstract "Same routine as Topic 1"
    `npm run learn:start 2` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 2` to see what's left · thinking work goes in `notebook/02/design-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `labs/02-test-design/tests/partitions.test.js` | EP and BVA for quantity, stock, book ids, shipping and the refund window, plus error guessing |
| `labs/02-test-design/tests/decision-table.test.js` | The refund policy and the assistant's routing rules as decision tables |
| `labs/02-test-design/tests/state-transition.test.js` | The order lifecycle: valid, invalid and sequence coverage |
| `labs/02-test-design/tests/properties.test.js` | Property-based and metamorphic tests with fast-check |
| `labs/02-test-design/tests/pairwise.test.js` | Checks of the pairwise generator itself |
| `labs/02-test-design/pairwise.mjs` | A small all-pairs generator and the shop's configuration factors |
| `labs/02-test-design/mutants.mjs` | Plants 10 bugs in a sandbox copy and scores each technique |
| `app/src/orders.js` | Order lifecycle and refund rules (new in this topic) |
| `notebook/_templates/02/design-notes.md` | Your notes for steps 1, 2, 3 and 5 |

### Step 0 — Baseline

```bash
npm install             # adds fast-check if you're coming from Topic 1
npm run learn:start 2
mkdir -p notebook/02 && cp notebook/_templates/02/design-notes.md notebook/02/
npm run design:test
```

```text title="Expected output (summary)"
ℹ tests 85
ℹ suites 16
ℹ pass 82
ℹ fail 0
ℹ todo 3
```

Three TODOs are findings recorded as tests:

- two different techniques finding the **same real bug** (error guessing and a property)
- one **open product question** found by a decision table

You'll resolve the bug in step 4.

### Step 1 — Partitions and boundaries (20 min)

1. Before you open the file, fill in the partition table for **quantity** in your notebook, using only the API contract in `app/openapi.yaml` (`/api/cart/price`). Mark the boundaries and pick a test value for each partition.
2. Compare your table with `partitions.test.js`. Did you include *not an integer*? Did you test 0 *and* 11?
3. Now apply EP to **`bookId`**. The contract says `type: integer`. What partitions does that create? Try one of them:

    ```bash
    node -e "import('./app/src/cart.js').then(m => console.log(m.priceCart([{ bookId: '3', quantity: 1 }]).lines[0]))"
    ```

    ```text title="Expected output"
    { bookId: 3, title: 'Prompting for QA', quantity: 1, lineTotal: 34 }
    ```

    What did the contract promise, and what happened? Decide in your notebook whether it's a bug, and why.

    ??? success "Discussion"
        The string `"3"` is accepted, though the contract says integer. The *robustness principle* says accept liberally; *contract-first* design says reject what the contract doesn't allow, because clients start depending on the leniency. Both positions are defensible. Topic 4 returns to this with contract testing.

### Step 2 — Decision tables (20 min)

1. Read the refund table in `decision-table.test.js` and the rules in `app/src/orders.js`. Check that the code implements each column.
2. Read the assistant's routing table, then look at the order of the `if` statements in `mockAnswer()` in `app/src/assistant.js`. Fill in the missing column in your notebook: *off-topic = Y, mentions shipping = Y*. What does the code do? What *should* it do?
3. See the open question for yourself:

    ```bash
    node -e "import('./app/src/assistant.js').then(async m => console.log((await m.answer('Will bad weather delay my delivery?', 'mock')).answer))"
    ```

    ```text title="Expected output"
    I can only help with questions about Quality Books - our books, orders, shipping and returns.
    ```

    A genuine customer question is declined. Don't fix it yet; that's the wrap-up challenge. The point is that the *table* exposed it, while every single-rule test passed.

### Step 3 — State transitions (15 min)

1. Draw the order state machine from memory, then compare it with section 4.4.
2. Fill in the **state × event table** in your notebook: 6 rows and 5 columns. Each cell is a target state or ✗. Count the ✗ cells.

    ??? success "Check your count"
        24 invalid cells: 30 cells minus the 6 valid transitions. If you got fewer, look for a transition you allowed that the requirement doesn't (can a *shipped* order be cancelled?).
3. Run only the state tests:

    ```bash
    node --test --test-reporter=spec labs/02-test-design/tests/state-transition.test.js
    ```

    All pass. Notice the test *"the code has no transitions the requirement does not"*. It compares the code's transition table with the hand-written model, so an extra arrow added in the code (a bug) fails the build.

### Step 4 — Find and fix a combination bug (30 min)

Every partition in step 1 was checked one line at a time.

#### 4.1 Hunt for it

**Your task (10 min):** using only carts where *every line on its own is valid*, make the shop sell more copies of a book than it has in stock. Use `node -e` with `priceCart`, or `curl` against `npm start`.

??? tip "Hint"
    Error guessing says: *try the same thing twice.*

??? success "Reveal"
    Reproduce it by hand:

    ```bash
    node -e "import('./app/src/cart.js').then(m => console.log(m.priceCart([{ bookId: 5, quantity: 2 }, { bookId: 5, quantity: 2 }]).subtotal))"
    ```

    ```text title="Expected output"
    108
    ```

    Book 5 has 3 in stock. The shop just sold 4. The same trick sells 12 or more copies of book 1 with two lines, getting around the 10-per-line limit.

#### 4.2 See a property find it on its own, from random inputs

```bash
node --test --test-reporter=spec --test-name-pattern="never sells more" labs/02-test-design/tests/properties.test.js
```

```text title="Expected output (values vary per run)"
✖ an accepted cart never sells more copies than are in stock # finds the duplicate-line bug; ...
  Error: Property failed after 26 tests
  { seed: 299939031, path: "25:1:3:1:2", endOnFailure: true }
  Counterexample: [[{"bookId":1,"quantity":6},{"bookId":1,"quantity":7}]]
  Shrunk 4 time(s)
  ...
  [cause]: AssertionError [ERR_ASSERTION]: sold 13 of book 1, stock 12
```

fast-check generated random carts, found a failing one, then **shrank** it to a small cart that still fails. Replay that exact run with `FC_SEED=<seed> npm run design:test`.

Why did the other properties miss it? Look at the `sellableCart` generator: `fc.uniqueArray(…)` can *never* produce the same book twice. **Generators encode assumptions.**

#### 4.3 Decide and make the fix

Two options: add up quantities per book, or reject duplicate lines. The UI never sends duplicates (it keeps one line per book), so rejecting them is simplest and closes both holes, stock and the 10-per-line limit. Change `priceCart` in `app/src/cart.js` so a second line for the same book throws a `ValidationError` whose message contains `more than once`.

??? success "Reference solution"
    ```js
    const seen = new Set();
    const lines = items.map(({ bookId, quantity }) => {
      const book = findBook(bookId);
      if (!book) throw new ValidationError(`unknown book ${bookId}`);
      if (seen.has(book.id)) throw new ValidationError(`book ${book.id} appears more than once; combine it into one line`);
      seen.add(book.id);
      // ...the quantity and stock checks stay as they are
    ```

#### 4.4 Keep the sources consistent

Topic 1's lesson: the contract must say what the code does. Add the rule to the `/api/cart/price` description in `app/openapi.yaml`.

??? success "Reference solution"

    ```yaml
    description: |
      Shipping is 4.90 EUR, free when the subtotal is 50 EUR or more.
      Quantity must be an integer from 1 to 10 and not exceed stock.
      Each book may appear on only one line.
    ```

(JSON Schema's `uniqueItems: true` wouldn't help here: it compares whole objects, so `{bookId: 5, quantity: 2}` and `{bookId: 5, quantity: 1}` count as different.)

#### 4.5 Turn both TODOs into real tests

In `partitions.test.js` and `properties.test.js`, delete the `{ todo: '…' }` line from the two duplicate-line tests. Run:

```bash
npm run design:test
```

```text title="Expected output (summary)"
ℹ tests 85
ℹ pass 84
ℹ fail 0
ℹ todo 1
```

The remaining TODO is the open product question from step 2. Also check you broke nothing elsewhere: `npm run test:unit && npm run foundations:test`.

### Step 5 — Generate a configuration matrix (15 min)

```bash
npm run design:pairwise
```

```text title="Expected output (summary)"
11 configurations cover every pair; all combinations would be 108.
```

1. Check a few pairs in the table by eye, for example *webkit + ar-EG*, or *mobile + slow-3g*.
2. Add a factor in `labs/02-test-design/pairwise.mjs`: `payment: ['card', 'paypal', 'invoice']`. Re-run. Exhaustive testing jumps from 108 to 324 configurations; pairwise goes from 11 to about 13. That's how pairwise scales: roughly with the square of the largest factor, not the product of all of them.
3. Run `npm run design:test`. The pairwise tests still pass. Then **undo the change**, because the test that expects exactly 108 combinations will fail otherwise.
4. In your notebook: which *triple* would you add as a seed because it is your riskiest real configuration?

    ??? tip "Hint"
        Right-to-left text, the smallest screen and the slowest network: which browser would you pair them with, and why?

### Step 6 — Score the techniques with mutation testing (20 min)

```bash
npm run design:mutants
```

```text title="Expected output (after step 4)"
Mutant                                              EP/BVA            Decision table    State transition  Property-based
M1 max quantity 10 → 11                             ✔ killed          ·                 ·                 ·
M2 min quantity 1 → 0                               ✔ killed          ·                 ·                 ·
M3 stock check off by one                           ✔ killed          ·                 ·                 ✔ killed
M4 free shipping at > 50, not >= 50                 ✔ killed          ·                 ·                 ·
M5 line totals not rounded to cents                 ·                 ·                 ·                 ✔ killed
M6 shipping decided per copy (BUG_MODE=cart)        ·                 ·                 ·                 ✔ killed
M7 shipped orders can be cancelled                  ·                 ·                 ✔ killed          ·
M8 refund window ends on day 29                     ✔ killed          ·                 ·                 ·
M9 damaged books refunded after the window          ·                 ✔ killed          ·                 ·
M10 assistant checks off-topic before injection     ·                 ✔ killed          ·                 ·
Killed by this technique                            5/10              2/10              1/10              3/10

✔ All 10 mutants killed. No single technique killed them all.
```

(Before step 4, M3 is caught by EP/BVA only and the property-based total is 2/10: the stock property was still a TODO.)

The script copies the app to a temporary folder, plants one bug at a time, and runs each technique's tests against it. Your working tree is never changed.

**Your task:** for each mutant killed by only one technique, explain why the others missed it. Then open the box.

??? success "Compare your explanation"
    - **M4 and M8** (`>` vs `>=`) are caught **only** by boundary tests. The property tests never see a subtotal of exactly 50.00 (no sellable cart costs that), and the decision table uses days 10 and 45, not 30.
    - **M5** (unrounded money) is caught **only** by a property. No hand-picked example checked line totals for float noise like `89.97000000000001`.
    - **M7** (an extra arrow) is caught **only** by state-transition tests of *invalid* pairs.
    - **M9 and M10** (rule order) are caught **only** by decision tables, because only they combine conditions.

Now prove a technique matters by removing it. In `partitions.test.js`, comment out the *"day 30 is still in time"* test and re-run:

```text title="Expected output (summary)"
✖ Survived every technique: M8 (refund window ends on day 29)
```

The script exits with code 1. Restore the test.

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 2
```

```text title="Expected output"
✔ Step 1-3 — Design notes: partitions, the missing routing column, the state table
    notebook/02/design-notes.md
✔ Step 4a — The same book on two lines is rejected
    rejected: book 5 appears more than once; combine it into one line
✔ Step 4b — The API contract states the one-line-per-book rule
    app/openapi.yaml updated
✔ Step 4c — Both duplicate-line TODOs are real tests, and nothing else broke
    84 design tests pass
✔ Step 6 — Mutation scorecard: every mutant killed
    all mutants killed; property-based 3/10

5/5 steps done for Topic 2: Test Design Techniques
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Commit and push to your fork when you're done.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find package 'fast-check'` | Dependencies installed before Topic 2 | `npm install` |
| A property test fails with a seed you can't reproduce | Each run is random by design | Re-run with the printed seed: `FC_SEED=<seed> npm run design:test` |
| After step 4, a *different* test fails: `assert.throws` … `only 3` | Your fix aggregates quantities, so the error message differs | Either is fine. The test accepts `more than once` or `only 3`; make your message contain one of them |
| `design:test` shows `todo 3` after step 4 | The `{ todo: … }` options are still in place | Delete the whole `{ todo: '…' },` line in both tests |
| Pairwise test fails: `got N rows` | You changed the factors | Expected while experimenting; restore `SHOP_FACTORS` |
| Pairwise test fails: `expected 108` | A factor was added or removed | Restore `SHOP_FACTORS`, or update the expected count if the change is intentional |
| `design:mutants`: `code to mutate not found in app/src/cart.js` | You changed a line a mutant targets (for example, rewrote the quantity check) | Update that mutant's `from`/`to` strings in `mutants.mjs` to match your code |
| `design:mutants`: `On correct code these must pass first` | A technique file is failing on the unmutated code | Run `npm run design:test` and fix that first |
| `design:mutants` is slow (> 30 s) | Antivirus scanning the temporary folder, or a slow disk | Expected on some machines; it runs about 44 small test processes |
| `EPERM` / symlink error on Windows | Creating symlinks needs Developer Mode | Enable Developer Mode, or run in WSL or Codespaces |
| State tests: `there are 24 invalid pairs` fails | States or events were added to `orders.js` | Update the hand-written `EXPECTED` model, and ask whether the requirement changed |
