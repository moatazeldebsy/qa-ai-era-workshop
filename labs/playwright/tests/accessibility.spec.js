import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ShopPage } from '../pages/ShopPage.js';

// Lab 1, step 6 - automated accessibility checks. axe-core finds the
// machine-checkable WCAG issues (roughly a third of them): missing labels,
// low contrast, broken ARIA. The keyboard test covers what it can't.

test('home page has no WCAG 2.1 A/AA violations', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await expect(shop.recommendations).toHaveCount(2); // let the async parts render
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  // On failure the message lists each rule, its impact and the offending HTML.
  expect(
    results.violations.map((v) => `${v.impact}: ${v.id} - ${v.help} (${v.nodes.map((n) => n.html).join(', ')})`),
  ).toEqual([]);
});

test('a keyboard-only user can add a book to the cart', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  // Tab from the search box to the first "Add to cart" button, then press Enter.
  await shop.search.focus();
  await page.keyboard.press('Tab');
  await expect(shop.addToCartButton('Testing in Production')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(shop.subtotal).toHaveText('29.99');
});
