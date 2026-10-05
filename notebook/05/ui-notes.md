# UI and end-to-end testing notes

Topic 5. Reference answer.

## Step 1 — What made `brittle.spec.js` brittle

| Line or pattern | What would break it | What I used instead |
|---|---|---|
| `page.waitForTimeout(1000)` | A slow machine (too short) or wasted time on a fast one | Web-first assertions that wait for the condition |
| `#book-list > li:nth-child(1) > button` | Reordering or filtering the catalogue | `getByRole('button', { name: 'Add Testing in Production to cart' })` via the page object |
| `page.$eval(...)` then `expect(total)` | Reading before the cart updates | `await expect(shop.total).toHaveText('34.89')` |
| `page.fill('input', ...)` | A second input earlier in the page | `getByLabel('Search books')` |
| `http://localhost:3210/` | Another port or environment | `page.goto('/')` with `baseURL` |

## Step 2 — The stuck cart

What the trace viewer showed me about the request after the stock error: the price request for the new book still contained `{ bookId: 5, quantity: 4 }`, the quantity the shop had already rejected.

Why every single-step test passed while the journey failed: each single-step test starts from an empty cart. The bug is state left behind by one step and carried into the next, so only a sequence of steps can show it.

## Step 3 — The race

Why the test holds the first response back instead of adding a delay: a delay only makes the bad order likely, and how likely depends on the machine. Holding the response until the second one is shown makes the order certain, so the test fails every time the bug is present and never otherwise.

What `aria-busy` gives a screen-reader user, and what it gives a test: the user hears that the cart is still updating, rather than trusting a total that's about to change. The test gets a reliable signal that every price request has finished, so it checks the final state, not a moment in between.

## Step 4 — The flaky test

How I proved the cause (commands and results): with `RECOMMENDATIONS_DELAY_MS=100` all 30 runs passed; with `RECOMMENDATIONS_DELAY_MS=1200` every BAD run failed and both GOOD tests passed. Only server timing changed, so timing is the cause.

Why retries would have hidden it rather than fixed it: with retries most runs pass on the second try, so the build is green, but the test still checks nothing reliably; it would keep failing at random and teach people to ignore it.

## Step 5 — The browser matrix

Which rows failed, and why: the three WebKit projects failed the keyboard-only test. In WebKit, Tab skips buttons by default (like Safari on macOS), so focus never reached "Add to cart".

Is that a bug in the shop, in the test, or neither? The test: it assumed Chromium's keyboard behaviour. I'd press Alt+Tab in WebKit, with a comment explaining why, and keep the test in the matrix so a real focus bug would still show.
