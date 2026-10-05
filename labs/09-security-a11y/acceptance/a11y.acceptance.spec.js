import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ShopPage } from '../../05-ui-e2e/e2e/pages/ShopPage.js';

test('accessible names contain their visible labels, also after searching', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.searchFor('pragmatic');
  await expect(shop.books).toHaveCount(1);
  const { violations } = await new AxeBuilder({ page }).withRules(['label-content-name-mismatch']).analyze();
  expect(violations).toEqual([]);
});

test('the out-of-stock button says so to assistive technology', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  const button = shop.addToCartButton('The Pragmatic Tester');
  await expect(button).toBeDisabled();
  await expect(button).toHaveAccessibleName(/out of stock/i);
});

test('the live region carries the new total and the cart error stays an alert', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.addToCart('Contract Testing in Practice', 2);
  await expect(shop.cart.getByRole('status')).toContainText('62.50');
  await shop.addToCart('Performance Engineering with k6', 4);
  await expect(page.getByRole('alert')).toContainText('only 3');
});
