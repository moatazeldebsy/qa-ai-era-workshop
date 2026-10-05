# Topic 9 · Lab

## 14. Hands-on lab: safe, usable, everywhere

You'll triage the project's dependency vulnerabilities, harden every HTTP response, close an abuse case on the internal inventory API, and fix two accessibility barriers that the usual automated scan reports as "zero violations".

**Time:** 2.5 hours

!!! abstract "Same routine as before"
    `npm run learn:start 9` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 9` to see what's left · thinking work goes in `notebook/09/security-a11y-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `labs/09-security-a11y/audit-triage.mjs`, `audit-policy.json` | Dependency triage: production versus development, direct versus transitive, and what the "fix" really is |
| `labs/09-security-a11y/tests/security.test.js` | Security tests for the shop and the inventory service; two TODO findings |
| `labs/09-security-a11y/a11y/a11y.spec.js` | Accessibility tests; two known barriers marked with `test.fail()` |
| `app/src/server.js`, `services/inventory/src/app.js`, `app/src/inventory-client.js` | Where the security fixes go |
| `app/public/app.js`, `app/public/index.html` | Where the accessibility fixes go |

### Step 0 — Baseline

```bash
npm run learn:start 9
mkdir -p notebook/09 && cp notebook/_templates/09/security-a11y-notes.md notebook/09/
npm run sec:test
npm run a11y:test
```

```text title="Expected output (summaries)"
ℹ tests 4
ℹ suites 2
ℹ pass 2
ℹ fail 0
ℹ todo 2

  3 passed (5.9s)
```

### Step 1 — Triage, don't panic (25 min)

```bash
npm audit
```

At the time of writing it ends with `5 vulnerabilities (2 moderate, 3 high)`, and suggests `npm audit fix --force`. **Don't run it yet.** Triage first:

```bash
npm run sec:audit
```

```text title="Expected output (at the time of writing; advisories change daily)"
HIGH      dev only    transitive  node-forge
          via: node-forge RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm elements
          fix: promptfoo@0.116.7 (breaking)
…
MODERATE  dev only    transitive  qs
          via: qs has a remotely triggerable DoS: qs.stringify crashes with TypeError on null/undefined entries in comma-form
          fix: npm audit fix

5 vulnerable packages: 0 in production dependencies, 5 in development tools only.
✔ Nothing in production at or above "moderate". Decide on the development-only findings and record the decision.
```

Your list may be different: new advisories appear, and fixes get released. For each finding, record a decision in your notebook (fix now, accept with a reason, or watch), and explain why you didn't run the suggested `--force` fix.

??? tip "Hint"
    Look at the suggested fix for `promptfoo`: a lower version number, marked breaking. Which code would actually run the vulnerable `node-forge` function, and when? Does any of it ship to customers?

### Step 2 — Harden every response (25 min)

```bash
npm start
curl -sI localhost:3210/
```

```text title="Expected output (excerpt)"
HTTP/1.1 200 OK
X-Powered-By: Express
x-request-id: 43c8603e-…
Content-Type: text/html; charset=utf-8
```

The shop announces its framework and sets none of the headers that tell browsers to block content sniffing, framing (clickjacking) and injected scripts. The first TODO in `security.test.js` says what's expected.

**Your task:** make every response from the shop (pages, scripts, API answers, errors) carry `Content-Security-Policy` (at least `default-src 'self'` and `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff` and a `Referrer-Policy`, without `X-Powered-By`. Then turn the TODO into a real test, and note in your notebook what each header protects against.

??? tip "Hint"
    `app.disable('x-powered-by')`, and a small middleware *before* everything else that calls `res.set({...})`. The page loads only its own script and styles, so a strict policy won't break it. Check `curl -sI localhost:3210/no/such/page` too.

??? success "Reference solution"
    ```js
    app.disable('x-powered-by');
    app.use((_req, res, next) => {
      res.set({
        'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Cross-Origin-Opener-Policy': 'same-origin',
      });
      next();
    });
    ```

    And before the error handler, answer unknown routes yourself: `app.use((_req, res) => res.status(404).json({ error: 'not found' }));`. Express's built-in 404 page sets its *own* CSP, replacing yours.

### Step 3 — An abuse case on an internal API (35 min)

Write this abuse case in your notebook before you look at the test: *"As an attacker, I…"*. How could someone make every book in the shop look sold out, without using the shop at all?

??? tip "Hint"
    Read `compose.yaml`: which ports are published? Then read what `POST /reservations` on the inventory service checks about its caller.

The second TODO in `security.test.js` holds the answer: anyone who can reach the inventory service can reserve every copy, every 15 minutes, for ever. It's "internal", but `compose.yaml` publishes its port, and it trusts every caller.

**Your task:** make the inventory service require a shared **service token** when one is configured (`createInventoryApp({ token })`, from `INVENTORY_TOKEN` in `server.js`). Every route except `/health` must answer **401** without it. Make the shop's inventory client send it (`createApp({ inventoryToken })`, from `INVENTORY_TOKEN`), and set it for both services in `compose.yaml`.

??? tip "Hint"
    Send it as `authorization: Bearer <token>`. Compare with `crypto.timingSafeEqual`, not `===`, so an attacker can't learn the token one character at a time from response times. Keep the check off when no token is configured, so Topic 4's contract tests keep working.

??? success "Reference solution"
    In `services/inventory/src/app.js`, after the `/health` route:

    ```js
    if (token) {
      app.use((req, res, next) => {
        const given = req.get('authorization') ?? '';
        const expected = `Bearer ${token}`;
        const ok = given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
        if (!ok) return res.status(401).json({ error: 'missing or invalid service token' });
        next();
      });
    }
    ```

    In the client, add `authorization: Bearer ${token}` to the reservation and release requests when a token is given. The rest is on the solutions branch: `git diff main origin/solutions -- services app/src/inventory-client.js compose.yaml`.

In your notebook: why is "it's internal" not a defence, and what would you add besides a shared token?

### Step 4 — Zero violations, two barriers (35 min)

`a11y.spec.js` starts with an axe scan against WCAG 2.2 A and AA: it passes. The other two tests are marked `test.fail()`: known barriers that standard rules don't report.

**4a. Label in name.** Each book's button *shows* "Add to cart" or "Out of stock", but its accessible name is `Add <title> to cart`, even when the book is sold out. Hear it for yourself: turn on VoiceOver (⌘F5 on macOS) or NVDA, and tab to *The Pragmatic Tester*. Then try it the way a voice-control user would: "click Add to cart" doesn't match any button's name.

**4b. Silent totals.** Add a book with a screen reader running. The total changes on screen, and nothing is announced.

**Your task:** fix both in `app/public/app.js` and `app/public/index.html`, remove the two `test.fail` lines, and make sure the Topic 5 browser tests still pass.

??? tip "Hint"
    WCAG 2.5.3: the accessible name must *contain* the visible text. Start the name with the button's own text, then add the title for context. For 4b, an element with `role="status"` is a polite live region: wrap the three total lines in one.

??? success "Reference solution"
    ```js
    button.setAttribute('aria-label', `${button.textContent}: ${book.title}`);
    ```

    ```html
    <div role="status">
      <p>Subtotal: <span data-testid="subtotal">0.00</span> EUR</p>
      <p>Shipping: <span data-testid="shipping">0.00</span> EUR</p>
      <p><strong>Total: <span data-testid="total">0.00</span> EUR</strong></p>
    </div>
    ```

Look at `ShopPage.addToCartButton()` in Topic 5's page object. It finds the button by role and *part* of its name (the title). Before this course updated it, it matched the exact name `Add … to cart`. The old Topic 5 test *"out-of-stock books cannot be added"* depended on the misleading name. Write down what that says about locators.

### Step 5 — Compatibility (15 min, notes)

Go back to the browser matrix from Topic 5, step 5: the keyboard test failed in every WebKit project. In your notebook, decide whether that's a product bug, a test bug or platform behaviour, and how a compatibility strategy should cover keyboard use in Safari. If you have a Mac, try it in Safari with and without *Press Tab to highlight each item* (Safari → Settings → Advanced).

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 9
```

```text title="Expected output"
✔ Step 2-3 — Hardened HTTP responses, and an internal API that requires a service token
    headers on every response; inventory refuses callers without the token
✔ Step 4 — Buttons say what they show, and the cart announces its total
    accessible names match labels; totals in a live region; browser suite still green
✔ Step 5 — Notes: dependency triage, headers, the abuse case, accessibility and compatibility
    notebook/09/security-a11y-notes.md

3/3 steps done for Topic 9: Security, Accessibility, and Compatibility Testing
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Commit and push to your fork when you're done. Never commit a real `INVENTORY_TOKEN`; the `local-dev-token` default in `compose.yaml` is for local environments only.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| The page is blank after adding the CSP | An inline script or style, or an external resource | The shop has none; check you didn't add any. The browser console names what was blocked |
| Headers are missing only on 404s | Express's default 404 page replaces them | Add your own 404 handler before the error handler |
| Orders fail with 503 after step 3 | The inventory service has a token, the shop doesn't send it | Set `INVENTORY_TOKEN` for *both* services, or neither |
| Topic 4 contract tests fail after step 3 | The token check is on even without a configured token | Only check when `token` is set |
| `test.fail` test reports "expected to fail, but passed" | You fixed it but left the `test.fail` line | Delete the line |
| Topic 5 tests fail after step 4 | A locator matches the old exact button name | Locate by role and the title (as `ShopPage` does) |
| `npm audit` shows different numbers | Advisories are published daily | Expected; triage what *you* see |
| `sec:audit` fails with "production finding" | A vulnerability now affects a production dependency | Real news: update that dependency, or record an exception with an owner and a date |
