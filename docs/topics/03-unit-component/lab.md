# Topic 3 · Lab

## 14. Hands-on lab: tests that would notice

You'll clean up a file of smelly tests, take control of time to find a refund bug, use test doubles to find two checkout bugs, build a coupon module test-first, and finally measure whether your tests would catch a bug, which coverage can't tell you.

**Time:** 2.5 hours

!!! abstract "Same routine as before"
    `npm run learn:start 3` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 3` to see what's left · thinking work goes in `notebook/03/unit-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `app/src/returns.js` | Refund claims; works out days since delivery from an injected clock |
| `app/src/checkout.js` | Places an order: price → reserve stock → charge → confirm, with injected collaborators |
| `app/src/coupons.js` | An empty stub: you build it in step 4 |
| `labs/03-unit-component/tests/smelly.test.js` | Passing tests full of smells (step 1) |
| `labs/03-unit-component/tests/returns.test.js` | Clock-injected tests, one TODO finding (step 2) |
| `labs/03-unit-component/tests/checkout.test.js` | Fakes, stubs and spies, one TODO finding (step 3) |
| `labs/03-unit-component/tests/interactions.test.js` | A test that checks *how*, not *what* (step 3) |
| `labs/03-unit-component/tests/coupons.test.js` | Your TDD starting point (step 4) |
| `labs/03-unit-component/stryker.config.json` | Mutation testing for checkout and returns (step 5) |
| `labs/03-unit-component/acceptance/` | What `learn:check` runs against your code. Read it *after* each step, not before |

### Step 0 — Baseline

```bash
npm install                       # adds Stryker if you're coming from Topic 2
npm run learn:start 3
mkdir -p notebook/03 && cp notebook/_templates/03/unit-notes.md notebook/03/
npm run unit:test
```

```text title="Expected output (summary)"
ℹ tests 19
ℹ suites 4
ℹ pass 16
ℹ fail 0
ℹ todo 3
```

Three TODOs: two real bugs recorded as tests, and the starting point for your coupon module.

### Step 1 — Name the smells (25 min)

Every test in `labs/03-unit-component/tests/smelly.test.js` passes. Read it, then run one test on its own:

```bash
node --test --test-name-pattern="cart works" labs/03-unit-component/tests/smelly.test.js
```

```text title="Expected output (excerpt)"
not ok 1 - cart works
  expected: 63.99
  actual: 34.89
```

It passes in the full file and fails on its own. Why? Fill in the smells table in your notebook: for each test, name the smell(s) from [section 4.8](concepts.md#48-test-smells) and what could go wrong because of them.

Then create `labs/03-unit-component/tests/clean.test.js` and rewrite **two** of the smelly tests properly: one behaviour per test, a name that states the rule, no shared state, no logic, a strong assertion.

??? tip "Hint"
    Look at the variable declared *outside* the tests, the `try`/`catch` with the assertion inside the `catch`, and what `'delivered'.length` has to do with orders.

??? success "Compare your smell list"
    | Test | Smells |
    |---|---|
    | `test1` | Obscure name; weak assertion (`assert.ok(r)` passes for any object); mutates shared state that the next test depends on (interacting tests) |
    | `cart works` | Eager test (three behaviours); depends on `test1` having run first; **silent catch**: if `priceCart` stops throwing for out-of-stock books, the `catch` never runs and the test still passes |
    | `shipping` | Conditional test logic (an `if` inside a loop decides the expected value); a failure doesn't say which quantity failed |
    | `orders` | Asserts something meaningless (`'delivered'.length === 9`) instead of `assert.equal(state, 'delivered')`; obscure name |
    | `new year` | Mystery guest: depends on the real clock; tests nothing about the product |

    A reference `clean.test.js` is on the solutions branch: `git diff main origin/solutions -- labs/03-unit-component/tests/clean.test.js`.

### Step 2 — Take control of time (30 min)

The returns policy says *"within 30 days of delivery"*. Read `app/src/returns.js` and `returns.test.js`. The tests inject a clock, so they can set any moment they like.

**Your task:** before you look at the TODO test, find a delivery time and a claim time where the code gives the wrong answer. Try your ideas in a scratch test file, or with `node -e`.

??? tip "Hint"
    The tests all use midday. What do the words *"30 days"* mean to a customer: thirty 24-hour periods, or thirty dates on the calendar? Try a delivery late in the evening.

??? success "Reveal"
    The TODO test in `returns.test.js` has it: delivered on **1 May at 23:30**, claimed on **1 June at 00:10** (Berlin time). For the customer that's day 31, too late. But `daysSinceDelivery` divides the elapsed milliseconds by 24 hours: 30 days and 40 minutes rounds down to 30, so the refund is granted. The code counts 24-hour periods; the policy counts calendar days in the shop's time zone.

Now fix `daysSinceDelivery` so it counts **calendar days in `SHOP_TIME_ZONE`** (Europe/Berlin), and turn the TODO into a real test. Add at least one test of your own for a case the existing tests don't cover.

??? tip "Hint"
    `new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(date)` gives the Berlin calendar date as `"2026-06-01"`. Turn two such dates into UTC midnights with `Date.UTC(y, m - 1, d)` and subtract. UTC has no clock changes, so every day is exactly 24 hours.

??? success "Reference solution"
    ```js
    const shopDate = (instant) => {
      const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
        .format(instant)
        .split('-')
        .map(Number);
      return Date.UTC(y, m - 1, d);
    };

    export function daysSinceDelivery(deliveredAt, now) {
      return Math.round((shopDate(now) - shopDate(deliveredAt)) / DAY_MS);
    }
    ```

`npm run learn:check 3` now runs eight acceptance cases against your fix, including both of 2026's clock changes.

### Step 3 — Doubles, and what they reveal (35 min)

Read `checkout.test.js`. In your notebook, write down which kind of double each collaborator gets (fake, stub or spy) and why that kind fits.

**3a. The leaked reservation.** The TODO test says a declined payment should give the reserved stock back. Run it and read the failure, then fix `createCheckout` and remove the TODO.

??? success "Reference solution"
    ```js
    } catch (err) {
      await inventory.release(reservationId);
      throw new CheckoutError(`payment failed: ${err.message}`);
    }
    ```

**3b. The email outage.** Nobody has written this test yet. Write one in `checkout.test.js` where the mailer's `send` rejects, after the payment has succeeded. What does `placeOrder` do? What does the customer experience? Note it in your notebook.

??? success "Reveal"
    `placeOrder` rejects, so the customer sees an error, even though their card was charged. Many will try again and pay twice.

The product decision: **a failing confirmation email must not fail a paid order.** The order is returned as usual, with `confirmationSent: false` so support can resend it. A successful send sets `confirmationSent: true`. Implement it, and keep your new test.

**3c. The test that checks how, not what.** Run `interactions.test.js` with the planted pricing bug:

```bash
BUG_MODE=cart node --test labs/03-unit-component/tests/interactions.test.js
```

```text title="Expected output (summary)"
ℹ pass 1
ℹ fail 0
```

Customers are being overcharged, and the test is green. It checks that each collaborator was *called*, not *what* was asked of it. Add one assertion so it fails with `BUG_MODE=cart` and still passes without it.

??? tip "Hint"
    `payments.charge.mock.calls[0].arguments[0]` is what the checkout asked the payment gateway to charge.

### Step 4 — Coupons, test-first (40 min)

Build `app/src/coupons.js` using the red–green–refactor cycle from [section 4.5](concepts.md#45-test-driven-development-tdd). The rules, as the product owner wrote them:

| Code | Rule |
|---|---|
| `WELCOME5` | 5 EUR off; needs a subtotal of at least 20 EUR |
| `BOOKS10` | 10% off the subtotal, rounded to the nearest cent (halves round up), at most 15 EUR |
| `SUMMER26` | 20% off, valid from 1 June to 31 August 2026 inclusive, by the calendar in Berlin |
| any code | Case and surrounding spaces don't matter; the result's `code` is in capitals |
| unknown or empty code | Rejected |

`applyCoupon(code, { subtotal, now })` returns `{ code, discount }`, or throws a `CouponError` whose message says why (`minimum`, `not valid`, `unknown`).

The loop:

1. **Red.** In `coupons.test.js`, remove the starter TODO and run `node --test labs/03-unit-component/tests/coupons.test.js`. It fails: `applyCoupon is not implemented yet`. Good: you've seen it fail.
2. **Green.** Write the *simplest* code that passes. Returning `{ code: 'WELCOME5', discount: 5 }` unconditionally is allowed.
3. **Refactor.** Tidy up while green.
4. **Repeat** with the next rule's test. Each new test should force the code to become more general.

Aim for at least eight tests, including boundaries (Topic 2: what are the boundaries of each rule?).

??? tip "Hint: the date rule"
    Compare *Berlin calendar dates* as strings: `'2026-05-31' < '2026-06-01'` works because the format sorts correctly. Inject `now`; never call `new Date()` inside the module.

??? success "Reference solution"
    On the solutions branch: `git diff main origin/solutions -- app/src/coupons.js labs/03-unit-component/tests/coupons.test.js`. Compare your *tests* first: did you pin the same boundaries?

### Step 5 — Coverage versus mutation testing (25 min)

First, coverage. On the starting code, both files are fully covered:

```bash
npm run unit:coverage
```

```text title="Expected output (coverage table, before your changes)"
ℹ   checkout.js | 100.00 |   100.00 |  100.00 |
ℹ   returns.js  | 100.00 |   100.00 |  100.00 |
```

Every line and every branch of both files ran, and yet both had real bugs. Now mutation testing:

```bash
npm run unit:mutate
```

```text title="Expected output (before your changes)"
-------------|------------------|----------|-----------|------------|----------|----------|
             | % Mutation score |          |           |            |          |          |
File         |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
-------------|--------|---------|----------|-----------|------------|----------|----------|
All files    |  82.05 |   82.05 |       32 |         0 |          7 |        0 |        0 |
 checkout.js |  76.47 |   76.47 |       13 |         0 |          4 |        0 |        0 |
 returns.js  |  86.36 |   86.36 |       19 |         0 |          3 |        0 |        0 |
```

Your fixes change the numbers. Open the HTML report (`reports/mutation/topic-03.html`) to see every surviving mutant in context. For each survivor, decide: *would this change hurt a customer?* If yes, write a test in `checkout.test.js` or `returns.test.js` that kills it. Reach **at least 90%**.

??? tip "Hint: typical survivors"
    - `refund: true` for an order that isn't delivered: a test checks the `reason`, but not the `refund` flag.
    - `inventory.reserve(... ({}))`: a test checks that *a* reservation exists, not *what* was reserved.
    - `arrivedDamaged = true` as the default: no test makes a claim without passing claim details.

??? success "Survivors you may decide to leave"
    - `newId = () => undefined`: the default id generator is never used by a test, because every test injects its own. You could test that the default produces a UUID, but the value is low.
    - On a machine whose time zone is Berlin, removing `timeZone` from the date format changes nothing, so that mutant survives locally and dies in CI (UTC). An **equivalent mutant**, but only on some machines. Write down why in your notebook.

The reference solution reaches about 94%.

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 3
```

```text title="Expected output"
✔ Step 1 — Name the smells and rewrite two tests cleanly
    notebook/03/unit-notes.md
✔ Step 2 — Refund window counts calendar days in Berlin
    all 8 calendar cases pass, including both clock changes
✔ Step 3a — Checkout cleans up after a declined payment and survives a failed email
    reservation released; a paid order survives a mailer outage
✔ Step 3b — The interaction test notices a wrong charge
    green on correct code, red on BUG_MODE=cart
✔ Step 4 — Coupons, built test-first
    13 tests of your own; all acceptance checks pass
✔ Step 5 — Mutation score of at least 90% on checkout and returns
    mutation score 94.1%

6/6 steps done for Topic 3: Unit and Component Testing
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Your test counts and score will differ. Commit and push to your fork when you're done.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module '@stryker-mutator/core'` or `stryker: command not found` | Dependencies installed before Topic 3 | `npm install` |
| `ExperimentalWarning: The MockTimers API is an experimental feature` | `t.mock.timers` in `returns.test.js` | Harmless; Node prints it once per run |
| Your date tests pass on your laptop but fail in CI | They depend on your machine's time zone | Write timestamps with an explicit offset (`+02:00` or `Z`); never rely on local time |
| Step 2 fails only the "clock change" cases | Dividing local-time differences by 24 hours | Compare calendar dates, as UTC midnights, not instants |
| A test that should fail passes | A missing `await` before `assert.rejects`, or an assertion inside a `catch` | `await assert.rejects(...)`; never assert only inside `catch` |
| Step 3b: the interaction test now fails on correct code too | The expected amount is wrong | 2 × 29.99 = 59.98 EUR, and shipping is free over 50 EUR |
| Step 4: `CouponError` checks fail | Throwing a plain `Error` | `throw new CouponError(...)`, and import it in the test |
| Step 5: score drops after adding tests | A new test file isn't in Stryker's command | Stryker runs `checkout.test.js`, `returns.test.js` and `interactions.test.js`. Put your mutant-killing tests there, or add your file to `commandRunner.command` |
| Stryker: `Initial test run failed` | A test fails on unmutated code | Run `npm run unit:test` and fix it first |
| `.stryker-tmp` folder appears | Stryker's sandbox | It's in `.gitignore`; delete it any time |
