import { test, expect } from '@playwright/test';
import { ShopPage } from '../pages/ShopPage.js';

// The two tests from labs/05-ui-e2e/brittle/brittle.spec.js, rewritten:
// role- and label-based locators (the way a user finds things), the page
// object for shared steps, web-first assertions instead of sleeps and one-shot
// reads, and baseURL instead of a hard-coded host.

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
