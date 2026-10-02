import { test, expect } from '@playwright/test';
import { ShopPage } from '../pages/ShopPage.js';

// The assistant through the UI: one happy path and one guardrail, to prove the
// wiring. Answer QUALITY is evaluated in Lab 6 with an eval suite, not here -
// E2E tests are the wrong tool for grading many prompts.

test('answers a price question from the catalogue', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  const answer = await shop.ask('How much is Prompting for QA?');
  expect(answer).toContain('34.00 EUR');
});

test('renders assistant output as text, never as HTML', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.ask('<img src=x onerror=alert(1)> what is your return policy?');
  await expect(shop.answer.locator('img')).toHaveCount(0);
});
