import { test, expect } from '@playwright/test';
import { ShopPage } from '../pages/ShopPage.js';

// Learning Path, Topic 5 — journeys: several steps, the way a customer
// really uses the shop. Single-step tests (shop.spec.js) all pass; these find
// bugs that only appear in a sequence of actions or with real timing.
//
// test.fail() records a KNOWN bug: the test is expected to fail, and the run
// stays green while it does. Once the bug is fixed, Playwright reports
// "expected to fail, but passed": that's your cue to delete the test.fail line.

test('a customer can fill a cart with several different books', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.addToCart('Testing in Production');
  await shop.addToCart('Prompting for QA');
  await expect(shop.subtotal).toHaveText('63.99');
  await expect(shop.shipping).toHaveText('0.00');
});

test('after a stock error, the cart keeps its last valid state and can still change', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.addToCart('Performance Engineering with k6', 4); // only 3 in stock
  await expect(shop.cartError).toContainText('only 3');
  await expect(shop.subtotal).toHaveText('81.00'); // still the valid 3 copies

  await shop.addToCart('Prompting for QA');
  await expect(shop.cartError).toHaveText('');
  await expect(shop.subtotal).toHaveText('115.00');
});

test('the cart shows the latest total even when price responses arrive out of order', async ({ page }) => {
  const shop = new ShopPage(page);
  // Hold the FIRST price response back until the second has been shown.
  // Real networks reorder responses all the time; controlling the order makes
  // the test repeatable instead of flaky.
  let first = true;
  let releaseFirst;
  const held = new Promise((resolve) => (releaseFirst = resolve));
  await page.route('**/api/cart/price', async (route) => {
    const isFirst = first; // decide before any await, so the order can't flip
    first = false;
    const response = await route.fetch();
    if (isFirst) await held;
    await route.fulfill({ response });
  });

  await shop.goto();
  await shop.addToCart('Testing in Production'); // request 1: held back
  await shop.addToCart('Testing in Production'); // request 2: answered at once
  await expect(shop.subtotal).toHaveText('59.98');

  releaseFirst(); // the stale answer (1 copy) arrives last
  await expect(shop.cart).toHaveAttribute('aria-busy', 'false');
  await expect(shop.subtotal).toHaveText('59.98');
});
