# Lab 1 — E2E with Playwright

Write browser tests that are readable, survive UI changes, and are quick to debug when they fail, and keep their number small.

By the end you'll have:

- run the shop's **11 end-to-end tests** and read their HTML report
- seen why **role- and label-based locators** survive changes that break CSS selectors
- written a **new journey test** and debugged a failure with a **Playwright trace**
- caught an **accessibility regression** with axe-core and a keyboard-only test

**Time:** 40 min · **Tracks:** QA, Dev · **Module:** [3. Tools & Technologies](../modules/03-tools-and-technologies.md)

## Prerequisites

- The [Quickstart](../start/setup.md) is done and `npm test` is green.
- No running app is needed: Playwright starts one on port 3210 for each run.

| File | What's in it |
|---|---|
| `labs/playwright/pages/ShopPage.js` | Page object; every locator is role-, label- or test-ID-based |
| `labs/playwright/tests/shop.spec.js` | Catalogue and cart journeys |
| `labs/playwright/tests/assistant.spec.js` | Assistant wiring, and a check that its output is never rendered as HTML |
| `playwright.config.js` | Projects (`e2e`, `api`, `flaky`), reporters, auto-started app |

## 1. Run the suite

```bash
npm run test:e2e
npx playwright show-report
```

```text title="Expected output"
  11 passed (5.2s)
```

The report lists every test with its steps. Failed tests get a screenshot and a trace.

## 2. Read the page object

```js title="labs/playwright/pages/ShopPage.js"
this.search = page.getByLabel('Search books');
this.askButton = page.getByRole('button', { name: 'Ask' });
this.total = page.getByTestId('total');
```

There is no CSS selector for anything a user can see. Role- and label-based locators find elements the way a user or a screen reader does. A test that can't find a button by its accessible name has also found an accessibility bug.

!!! tip "Locator order of preference"
    `getByRole` → `getByLabel` → `getByText` → `getByTestId` → CSS/XPath only as a last resort.

## 3. Prove the resilience

Change the markup without changing what the user sees, then re-run:

=== "Rename a class"

    In `app/public/app.js`, change `el('li', undefined, 'book')` to `el('li', undefined, 'card')`.

=== "Wrap the search box"

    In `app/public/index.html`, wrap `<input id="search" …>` in an extra `<div>`.

```bash
npm run test:e2e
```

Still **11 passed**. Now change the label text *Search books* to *Find*. The tests go red, as they should: the user-visible contract changed. Undo your edits.

## 4. Write a test

Add a test to `shop.spec.js` for this rule:

> *Searching for an author's surname, in any case, shows only their book.*

??? success "One solution"
    ```js title="labs/playwright/tests/shop.spec.js"
    test('search matches authors, case-insensitively', async ({ page }) => {
      const shop = new ShopPage(page);
      await shop.goto();
      await shop.searchFor('SILVA');
      await expect(shop.books).toHaveCount(1);
      await expect(shop.books.first()).toContainText('Performance Engineering with k6');
    });
    ```

```text title="Expected output"
  12 passed
```

## 5. Debug a failure with a trace

Break a test on purpose: in the free-shipping test, change `'34.89'` to `'34.88'`. Then:

```bash
npm run test:e2e
npx playwright show-trace test-results/playwright/*charges-shipping*/trace.zip
```

The trace viewer shows every action, a DOM snapshot before and after each one, the network calls, and the console. It's the first thing to open when a test fails in CI, where `trace: 'retain-on-failure'` keeps it for you. Undo the change.

## 6. Check accessibility

`labs/playwright/tests/accessibility.spec.js` runs **axe-core**, which checks the page against the WCAG 2.1 A and AA rules, and drives the cart with the keyboard only:

```js title="labs/playwright/tests/accessibility.spec.js"
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();
expect(results.violations.map((v) => `${v.impact}: ${v.id} - ${v.help} ...`)).toEqual([]);
```

Both pass on the shop as shipped. Now break it, in two ways.

=== "Experiment A: remove the page language"

    In `app/public/index.html`, change `<html lang="en">` to `<html>`, then:

    ```bash
    npx playwright test --project=e2e accessibility
    ```

    ```text title="Expected output"
    +   "serious: html-has-lang - <html> element must have a lang attribute (<html>)",
      1 failed
      1 passed
    ```

    axe names the rule, its impact and the exact element. Screen readers use `lang` to pick a voice and pronunciation. Undo the change.

=== "Experiment B: remove the search label"

    In `app/public/index.html`, delete the line `<label for="search">Search books</label>`, then:

    ```bash
    npx playwright test --project=e2e
    ```

    The axe test **still passes**: axe accepts the placeholder as the field's accessible name. But the keyboard test and the search tests **fail**, because `getByLabel('Search books')` no longer finds anything. A placeholder disappears as soon as you type, so it's a poor label. Two lessons: automated checks are incomplete, and accessible markup and resilient tests are the same thing. Undo the change.

!!! note "Automated checks find about a third of issues"
    axe-core catches what a machine can check: missing labels, low contrast, invalid ARIA. Keyboard flows, focus order, and whether alt text actually makes sense still need a person, or at least a test like the keyboard one here.

## The whole lab, end to end

```bash
npm run test:e2e                                  # 1. run
npx playwright show-report                        #    read the report
# 3. change markup, re-run, undo
# 4. add the author-search test, re-run
npx playwright show-trace test-results/playwright/<test>/trace.zip   # 5. debug
npx playwright test --project=e2e accessibility    # 6. a11y: break the label, re-run
```

## Stretch goals

- Run in UI mode: `npx playwright test --project=e2e --ui`.
- Add a mobile project to `playwright.config.js` with `devices['Pixel 7']` and run the suite on it.
- Start the app (`npm start`), record a journey with `npx playwright codegen http://localhost:3210`, then refactor the generated code into the page object. Compare its locators with ours.

## Debrief

1. Which cart tests could be API tests instead? Why keep any of them in the browser?
2. What did the trace show that a screenshot wouldn't?
3. How many E2E tests should a feature like the cart have?

## Next steps

<div class="grid cards" markdown>

-   **Lab 2 — API testing**

    ---

    Move the business rules below the UI: faster, more cases, data-driven.

    [→ Lab 2](lab-02-api-testing.md)

-   **Lab 4 — Flaky tests**

    ---

    Why `waitForTimeout` makes tests lie, and the two proper fixes.

    [→ Lab 4](lab-04-flaky-tests.md)

</div>
