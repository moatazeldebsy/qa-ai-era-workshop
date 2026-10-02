# Lab 1 — E2E with Playwright

**Time:** 40 min · **Tracks:** QA, Dev · **Module:** [3. Tools & Technologies](../modules/03-tools-and-technologies.md)

## Goal

Write browser tests that are **readable, resilient to UI change and fast to debug**, and keep them few.

## Files

- `labs/playwright/pages/ShopPage.js`: page object with role/label-based locators
- `labs/playwright/tests/shop.spec.js`: catalogue and cart journeys
- `labs/playwright/tests/assistant.spec.js`: assistant wiring and output safety
- `playwright.config.js`: projects, reporters, auto-started app

## Steps

**1. Run the suite.**

```bash
npm run test:e2e
```

Nine tests pass. Open the report with `npx playwright show-report`.

**2. Read the page object.** Notice there are no CSS selectors for things a user can see:

```js
this.search = page.getByLabel('Search books');
this.askButton = page.getByRole('button', { name: 'Ask' });
```

Role- and label-based locators find elements the way a user (or a screen reader) does. A test that can't find a button by its accessible name has also found an accessibility bug.

**3. Prove the resilience.** In `app/public/styles.css` or `index.html`, rename the CSS class `book` to `card`, or wrap the search input in an extra `<div>`. Re-run: still green. Now change the label text *"Search books"* to *"Find"*: red. That's intended, because the user-visible contract changed.

Undo your changes.

**4. Write a test.** Add to `shop.spec.js`:

> *Searching for an author's surname (case-insensitive) shows only their book.*

??? success "One solution"
    ```js
    test('search matches authors, case-insensitively', async ({ page }) => {
      const shop = new ShopPage(page);
      await shop.goto();
      await shop.searchFor('SILVA');
      await expect(shop.books).toHaveCount(1);
      await expect(shop.books.first()).toContainText('Performance Engineering with k6');
    });
    ```

**5. Debug a failure with a trace.** Break a test on purpose (change `'34.89'` to `'34.88'`), run it, then:

```bash
npx playwright show-trace test-results/playwright/*/trace.zip
```

Step through the actions, the DOM snapshots and the network calls. This is the first thing to open when a test fails in CI. Undo the change.

## Stretch goals

- Run in UI mode: `npx playwright test --project=e2e --ui`.
- Add a mobile project to `playwright.config.js` with `devices['Pixel 7']` and run the suite on it.
- Use `npx playwright codegen http://localhost:3210` (with `npm start` running) to record a journey, then refactor the generated code into the page object. Compare its locators to ours.

## Debrief

1. Which of the cart tests could be API tests instead? Why keep any of them as E2E?
2. What did the trace show you that a screenshot wouldn't?
3. How many E2E tests should a feature like the cart have?
