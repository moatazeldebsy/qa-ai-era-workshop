# Topic 7 · Lab

## 14. Hands-on lab: environments you can trust, data you can share

You'll run Quality Books in three environments, make tests that share one environment stop interfering, use a seeded data generator to find a bug no hand-made fixture could, and fix a masking script before its output reaches a test environment.

**Time:** 2.5 hours

!!! abstract "Same routine as before"
    `npm run learn:start 7` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 7` to see what's left · thinking work goes in `notebook/07/data-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `Dockerfile`, `compose.yaml` | A disposable two-service environment |
| `services/inventory/src/app.js` | The inventory service, now with an opt-in test-data API (`PUT /stock/:bookId`) |
| `labs/07-env-data/shared/` | Three tests written against a shared environment's seed data |
| `labs/07-env-data/shared-env.mjs` | Runs those tests against ONE inventory service, in parallel, several times |
| `labs/07-env-data/generate.mjs` | A synthetic order-history generator |
| `app/src/reports.js` | A new back-office sales report |
| `labs/07-env-data/tests/` | Tests for the generator and the report; two TODO findings |
| `labs/07-env-data/data/*.csv` | A "production export" of customers and orders (fictitious, but treat it as real) |
| `labs/07-env-data/mask.mjs` | A masking script, written on a Friday afternoon |
| `labs/07-env-data/pii-scan.mjs` | Checks the masked output for leaks, reversibility and broken joins |

### Step 0 — Baseline

```bash
npm run learn:start 7
mkdir -p notebook/07 && cp notebook/_templates/07/data-notes.md notebook/07/
npm run data:test
```

```text title="Expected output (summary)"
ℹ tests 8
ℹ suites 2
ℹ pass 6
ℹ fail 0
ℹ todo 2
```

### Step 1 — Three environments, one codebase (25 min)

The shop and the inventory service read their configuration from the environment (`PORT`, `INVENTORY_URL`, `INVENTORY_PORT`, `INVENTORY_TEST_DATA`). Run them three ways:

1. **In process.** Topic 4's integration tests start both services inside the test: `npm run contract:test`.
2. **Locally.** `npm run start:all`, then place an order and check the stock:

    ```bash
    curl -s localhost:3210/api/orders -H 'content-type: application/json' \
      -d '{"items":[{"bookId":1,"quantity":1}],"paymentToken":"tok_visa","customer":{"email":"ada@example.com"}}'
    curl -s localhost:3220/stock/1
    ```

3. **In containers** (needs Docker). The same code, built into an image, wired by `compose.yaml`:

    ```bash
    docker compose up --build --wait     # build, start, wait for both health checks
    # …repeat the two curl commands…
    docker compose down --volumes        # throw the whole environment away
    ```

    The course's CI builds and smoke-tests this environment on every push (the `environment` job in `.github/workflows/ci.yml`), so it works even if you can't run Docker yourself.

Fill in the environments table in your notebook: start-up time, closeness to production, and who else could break it. Then read `compose.yaml`: why does the inventory service set `INVENTORY_TEST_DATA: "on"`, and what would happen if production did the same?

### Step 2 — Tests that share an environment (30 min)

The three tests in `labs/07-env-data/shared/` were written for a shared staging environment. Each one relies on the seed data: *book 5 starts with 3 copies*. One at a time, they pass:

```bash
RUNS=3 CONCURRENCY=1 npm run data:shared
```

```text title="Expected output (end)"
3/3 runs green.
```

In parallel, as a busy team's pipelines would run them:

```bash
npm run data:shared
```

```text title="Expected output (end)"
run  9  ✖ red: reserving the last copies of a book leaves none; a reservation for more than is left is refused; releasing a reservation puts the copies back
run 10  ✖ red: reserving the last copies of a book leaves none; a reservation for more than is left is refused; releasing a reservation puts the copies back

0/10 runs green.
```

**Your task:** before fixing anything, write down why "reset the data before each test" would *not* fix this in a shared environment. Then change the tests (and `helpers.js`) so that each test owns its data, and run them in parallel again.

??? tip "Hint"
    The inventory service in this environment has a test-data API: `PUT /stock/:bookId` with `{ "available": 3 }` creates stock for any book id. A book id nobody else uses is a book nobody else can change.

??? success "Reference solution"
    In `helpers.js`:

    ```js
    export async function ownBook(available) {
      const bookId = 100_000 + Math.floor(Math.random() * 900_000);
      const res = await fetch(`${INVENTORY}/stock/${bookId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ available }),
      });
      if (!res.ok) throw new Error(`could not create test stock (${res.status}): is the test-data API on?`);
      return bookId;
    }
    ```

    In each test: `const book = await ownBook(3);`, then use `book` wherever the test used `5`.

```text title="Expected output after the fix (end)"
10/10 runs green.
```

### Step 3 — Data that finds bugs (35 min)

`app/src/reports.js` is a new back-office sales report. Its tests with a hand-made fixture (three delivered orders) pass. Now look at the TODO test in `labs/07-env-data/tests/reports.test.js`. It feeds the report 500 generated orders with a realistic mix of states:

```bash
node --test --test-reporter=spec labs/07-env-data/tests/reports.test.js
```

```text title="Expected output (excerpt)"
✖ failing tests:
  + actual - expected
  + 64391.17
  - 54396.27
```

**Your task:** look at a few generated orders (`npm run data:generate -- 5 1`), find out why the report's revenue is about 10,000 EUR too high, and fix `salesReport` so **every** figure (orders, revenue, average, books, top customer) only counts orders the shop kept the money for.

??? tip "Hint"
    What does each order's `state` say? Which states mean the customer got their money back, or never paid?

??? success "Reference solution"
    ```js
    const NOT_KEPT = new Set(['cancelled', 'refunded']);

    export function salesReport(history) {
      const orders = history.filter((o) => !NOT_KEPT.has(o.state));
      // …the rest works on `orders` as before
    }
    ```

Now the second TODO, in `generator.test.js`: *the same seed always gives the same data*. Run `npm run data:generate -- 3 42` twice and compare. The generator ignores its seed, so a failure found with generated data can't be replayed.

**Your task:** make `generateOrders` use its `seed`, so the same seed always produces the same orders, and different seeds produce different ones.

??? tip "Hint"
    `Math.random()` can't be seeded. A tiny seeded generator such as *mulberry32* is about six lines: keep a 32-bit state, advance it on every call, and scramble it into a number between 0 and 1. Also check the shuffle: `sort(() => random() - 0.5)` is a biased shuffle; Fisher–Yates isn't.

??? success "Reference solution"
    ```js
    let state = seed >>> 0;
    const random = () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    ```

Turn both TODOs into real tests. `npm run data:test` should end with `ℹ pass 8` and `ℹ todo 0`.

### Step 4 — Mask before you copy (35 min)

`labs/07-env-data/data/` holds a "production export": 15 customers and 30 orders, with names, emails, phone numbers, streets and free-text delivery notes. Someone wants it in the test environment, so they wrote `mask.mjs`. Run it, then scan the result:

```bash
npm run data:mask
npm run data:scan
```

```text title="Expected output"
✖ Not safe or not useful yet:

  - 33 personal values leak into the masked files, e.g. name: Lena Becker · email user name: lena.becker · name: Jonas Tanaka · email user name: jonas.tanaka
  - 15 pseudonyms are a plain SHA-256 of the email: anyone with the customer list can reverse them
  - 30 of 30 orders no longer join to a customer
```

Open `labs/07-env-data/masked/orders.csv` and see for yourself.

**Your task:** rewrite `mask.mjs` so the scan passes:

1. **No leaks:** names, emails, phones and streets are gone, including from the delivery notes.
2. **Keyed pseudonyms:** the same email always gets the same pseudonym *for a given secret key* (`MASK_KEY` from the environment), and nobody without the key can recompute it.
3. **Still useful:** every order still joins to its customer, and no rows are lost.

??? tip "Hint"
    `crypto.createHmac('sha256', key).update(email).digest('hex')` is a keyed hash. Use the *same* function for `customers.email` and `orders.customer_email`. For the notes, replace anything that looks like an email or a phone number, and every customer name you know from the export.

??? success "Reference solution"
    On the solutions branch: `git diff upstream/main upstream/solutions -- labs/07-env-data/mask.mjs`. The key parts:

    ```js
    const pseudonym = (email) => `u_${crypto.createHmac('sha256', key).update(email.trim().toLowerCase()).digest('hex').slice(0, 12)}@masked.example`;
    const scrub = (text) => {
      let out = text.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]').replace(/\+?\d[\d\s/-]{7,}\d/g, '[phone]');
      for (const n of names) out = out.replaceAll(n, '[name]');
      return out;
    };
    ```

```bash
MASK_KEY=choose-a-secret npm run data:mask
npm run data:scan
```

```text title="Expected output after the fix"
✔ No personal values found, pseudonyms can't be recomputed without the key, and all 30 orders still join to their customers.
```

Finally, in your notebook: the masked data keeps city, postcode and order dates. How could those still identify someone?

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 7
```

```text title="Expected output"
✔ Step 2 — Shared-environment tests own their data and pass in parallel
    5/5 parallel runs green against one shared service
✔ Step 3 — Realistic, reproducible data: the report counts only kept money
    seeded generator; revenue, averages and book totals only count kept orders
✔ Step 4 — The masked export is safe and still useful
    no personal values, keyed pseudonyms, every order still joins
✔ Step 5 — Notes: environments, shared data, realistic data and masking
    notebook/07/data-notes.md

4/4 steps done for Topic 7: Test Environments and Test Data Management
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Step 1 has no automatic check: its answers live in your notebook. Commit and push to your fork when you're done. **Don't commit `labs/07-env-data/masked/`** (it's in `.gitignore`), and never commit `MASK_KEY`.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `data:shared` hangs | An old version of `shared-env.mjs` used `spawnSync`, which blocks the shared service in the same process | Update from main; the runner must use async `spawn` |
| `could not create test stock (404)` | The service's test-data API is off | `data:shared` turns it on; a server you started yourself needs `INVENTORY_TEST_DATA=on` |
| Step 2 still red after using `ownBook` | One test still reads or reserves book 5 | Search the three tests for `5` |
| `Set MASK_KEY to a secret` | Your new `mask.mjs` requires a key, and none was given | `MASK_KEY=… npm run data:mask` |
| The scan still finds names | A name appears in a note in a form you didn't replace (first name only, or different case) | Replace full names first, then first and last names on their own |
| Orders don't join after your fix | Emails are normalised differently in the two files | Trim and lowercase before hashing, in one shared function |
| `docker compose up` fails: `Cannot connect to the Docker daemon` | Docker isn't running | Start Docker Desktop (or the Docker service); or skip step 1's container part: CI runs it |
| Compose: port 3210 or 3220 already allocated | `npm run start:all` is still running | Stop it, then `docker compose up` again |
