# Topic 5 · Lab

## 14. Hands-on lab: journeys, timing and browsers

You'll rewrite brittle tests, use the trace viewer to understand a journey bug, reproduce a race condition by controlling the network, cure a flaky test at its root, and run the shop across a pairwise matrix of browsers, screen sizes and locales.

**Time:** 3 hours

!!! abstract "Same routine as before"
    `npm run learn:start 5` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 5` to see what's left · thinking work goes in `notebook/05/ui-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `app/public/app.js`, `index.html` | The shop's front end: catalogue, cart, recommendations, assistant |
| `labs/05-ui-e2e/e2e/pages/ShopPage.js` | The page object: locators and actions for the shop |
| `labs/05-ui-e2e/e2e/tests/shop.spec.js` | Single-step checks of the catalogue and cart |
| `labs/05-ui-e2e/e2e/tests/journeys.spec.js` | Multi-step journeys; two known bugs marked with `test.fail()` |
| `labs/05-ui-e2e/brittle/brittle.spec.js` | Two passing tests that will break at the first change (step 1) |
| `labs/05-ui-e2e/flaky/tests/` | A flaky test and two correct versions of it |
| `labs/05-ui-e2e/playwright.matrix.config.js` | Topic 2's pairwise generator, turned into Playwright projects |
| `labs/05-ui-e2e/acceptance/` | What `learn:check` runs against your fixes |

### Step 0 — Baseline

```bash
npx playwright install chromium   # if you haven't already
npm run learn:start 5
mkdir -p notebook/05 && cp notebook/_templates/05/ui-notes.md notebook/05/
npm run test:e2e
```

```text title="Expected output (end)"
  14 passed (5.8s)
```

All green, but two of those "passes" are `test.fail()` tests: known bugs that are expected to fail. Open `journeys.spec.js` and read them. Then open the HTML report with `npx playwright show-report`: the two known bugs are listed as *expected to fail*.

### Step 1 — Brittle to resilient (30 min)

`labs/05-ui-e2e/brittle/brittle.spec.js` passes:

```bash
npm run ui:brittle
```

```text title="Expected output (end)"
  2 passed (2.4s)
```

In your notebook, list every line that would break the test without the product being broken: the catalogue order changes, a second input appears on the page, the server runs on another port, a slow CI machine. Then write `labs/05-ui-e2e/e2e/tests/refactored.spec.js` with the same two checks, using the page object, role and label locators, web-first assertions and `baseURL`.

??? tip "Hint"
    `ShopPage` already has `addToCart(title)`, `searchFor(text)`, `books` and `total`. A web-first assertion such as `await expect(shop.total).toHaveText('34.89')` replaces both the sleep and the `$eval`.

??? success "Reference solution"
    ```js
    test('adding one copy of a 29.99 EUR book shows a total of 34.89 EUR', async ({ page }) => {
      const shop = new ShopPage(page);
      await shop.goto();
      await shop.addToCart('Testing in Production');
      await expect(shop.total).toHaveText('34.89');
    });

    test('searching for "k6" shows only the k6 book', async ({ page }) => {
      const shop = new ShopPage(page);
      await shop.goto();
      await shop.searchFor('k6');
      await expect(shop.books).toHaveCount(1);
      await expect(shop.books.first()).toContainText('Performance Engineering with k6');
    });
    ```

### Step 2 — A bug only a journey can see (35 min)

Remove the `test.fail(...)` line from the **stuck cart** test in `journeys.spec.js` and run it with a trace:

```bash
npx playwright test --project=e2e journeys --trace on
npx playwright show-trace test-results/playwright/journeys-after-a-stock-err-*/trace.zip
```

In the trace viewer, step through the actions. Open the **Network** tab and click the `/api/cart/price` request made when you add *Prompting for QA*. What did the front end send?

??? success "Reveal"
    The request body still asks for **4** copies of the k6 book (stock 3), plus one *Prompting for QA*. When the shop rejected the 4th copy, `addToCart` had already put it in the front end's cart, and nothing took it out again. From then on every price request is impossible, so the customer is stuck. Each single-step test passed, including the one that checks the error message.

Fix `addToCart` in `app/public/app.js`: when the shop rejects a change, the cart must go back to its last valid state.

??? tip "Hint"
    Remember the old quantity before changing it. Have `renderCart()` return whether the shop accepted the cart, and restore the old quantity when it didn't.

??? success "Reference solution"
    ```js
    async function addToCart(bookId) {
      const before = cart.get(bookId) ?? 0;
      cart.set(bookId, before + 1);
      if (!(await renderCart())) {
        if (before) cart.set(bookId, before);
        else cart.delete(bookId);
      }
    }
    ```

    `renderCart` returns `false` when the response isn't OK, and `true` otherwise.

Run the journeys again. The stuck-cart test now passes without `test.fail`.

### Step 3 — Make a race repeatable (35 min)

Read the third test in `journeys.spec.js`. It **holds back the first price response** until the second has been shown, then releases it, the way a real network can deliver responses in a different order from the requests. It waits for the cart's `aria-busy="false"`, which the front end sets once every price request has finished.

Remove its `test.fail(...)` line and run it. It fails every time:

```text title="Expected output (excerpt)"
Error: expect(locator).toHaveText(expected) failed
Expected: "59.98"
Received: "29.99"
```

The cart has two copies but shows the price of one: the late, stale answer overwrote the new one.

**Your task:** before fixing it, write in your notebook why the test holds a response back instead of just adding a delay, and what `aria-busy` gives a screen-reader user as well as the test.

Then fix `renderCart`: only the **newest** price request may update the cart.

??? tip "Hint"
    Number each request. When a response arrives, if a newer request has been sent since, ignore this response.

??? success "Reference solution"
    ```js
    let latestRequest = 0;
    // in renderCart, before the fetch:
    const request = ++latestRequest;
    // after reading the response body:
    if (request !== latestRequest) return true; // a newer request has the final say
    ```

`learn:check 5` also runs acceptance tests with other books and three quick clicks, so a fix that only fits these two tests won't pass.

### Step 4 — Cure a flaky test (30 min)

The bad test sleeps 700 ms and then counts the recommendations once; the server takes 200–1500 ms.

```bash
npm run test:flaky        # every flaky test, 10 times
```

```text title="Expected output (numbers vary)"
  6 failed
    [flaky] › recommendations.bad.spec.js › BAD: sleeps a fixed time, then asserts once
  24 passed
```

**Prove** the cause by controlling the server's speed:

```bash
RECOMMENDATIONS_DELAY_MS=100  npx playwright test --project=flaky --repeat-each=10   # all pass
RECOMMENDATIONS_DELAY_MS=1200 npx playwright test --project=flaky --repeat-each=10   # every BAD run fails
```

Then see retries **hide** it: `npx playwright test --project=flaky --repeat-each=10 --retries=2`. Most runs now pass, and the report labels some as *flaky*.

Fix `recommendations.bad.spec.js` so it passes every time, even on the slow server, with no sleep and no retry. `recommendations.good.spec.js` shows two correct approaches.

??? success "Reference solution"
    ```js
    test('BAD (now fixed): waits for the recommendations instead of a clock', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#recommendations li')).toHaveCount(2);
    });
    ```

!!! note "Make sure no app is already running on port 3210"
    Playwright reuses a running app and ignores `RECOMMENDATIONS_DELAY_MS` if one is already up.

### Step 5 — The browser matrix (30 min, optional install)

`labs/05-ui-e2e/playwright.matrix.config.js` imports Topic 2's `allPairs()` and turns every row into a Playwright project: browser × viewport × locale.

=== "Chromium only (no extra install)"

    ```bash
    MATRIX_BROWSERS=chromium npm run ui:matrix
    ```

    ```text title="Expected output (end, after steps 2 and 3)"
      42 passed (15.0s)
    ```

=== "All three engines"

    ```bash
    npx playwright install firefox webkit
    npm run ui:matrix
    ```

    ```text title="Expected output (end, after steps 2 and 3)"
      3 failed
        [webkit-mobile-ar-EG] › accessibility.spec.js › a keyboard-only user can add a book to the cart
        [webkit-tablet-en-GB] › accessibility.spec.js › a keyboard-only user can add a book to the cart
        [webkit-desktop-de-DE] › accessibility.spec.js › a keyboard-only user can add a book to the cart
      137 passed (1.1m)
    ```

Ten projects instead of the 27 full combinations. Open the trace of a WebKit failure. Where did focus go after Tab? Record your findings in the notebook.

??? success "Discussion"
    WebKit, like Safari on macOS, by default doesn't move focus to buttons with Tab. Users enable "Press Tab to highlight each item", or use Option+Tab. The shop isn't broken. The test assumed Chromium's keyboard behaviour. A fair fix is a browser-aware key (`browserName === 'webkit' ? 'Alt+Tab' : 'Tab'`) with a comment explaining why. That's a real compatibility finding: the matrix tested the *tests'* assumptions too.

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 5
```

```text title="Expected output"
✔ Step 1 — Brittle tests rewritten with resilient locators and web-first assertions
    2 passed (1.4s)
✔ Step 2-3 — The stuck cart and the stale-price race are fixed
    journeys and acceptance checks pass
✔ Step 4 — The recommendations test is no longer flaky, even on a slow server
    passes every run with a 1.2 s server (9 passed (6.1s))
✔ Step 5 — Notes: brittleness, the journey bugs, flakiness and the browser matrix
    notebook/05/ui-notes.md

4/4 steps done for Topic 5: UI, Web, and End-to-End Testing
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Timings will differ. Commit and push to your fork when you're done.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Executable doesn't exist at …/chromium-…` | Browsers not installed | `npx playwright install chromium` (add `firefox webkit` for the matrix) |
| Every test fails with `Unexpected end of JSON input` | Another app is on port 3210 and Playwright reused it | Stop it, or `PORT=3300 npm run test:e2e` |
| Step 2/3: "expected to fail, but passed" | You fixed the bug but left `test.fail(...)` | Delete the `test.fail` line |
| Step 3 still fails after your fix | Requests are numbered *after* the `await`, or the check runs before the body is read | Take the number before `fetch`, compare after `res.json()` |
| Step 4 passes locally but `learn:check` fails it | The checker runs a 1.2 s server; a short custom timeout is too tight | Rely on the default expect timeout (5 s) |
| `show-trace` can't find the file | The path differs on your machine | `ls test-results/playwright/` and pick the folder for the failing test |
| Matrix: `browserType.launch: Executable doesn't exist` for firefox/webkit | Those engines aren't installed | `npx playwright install firefox webkit`, or `MATRIX_BROWSERS=chromium` |
| Linux: missing system libraries for WebKit | WebKit needs extra packages | `npx playwright install --with-deps webkit`, or use Codespaces |
