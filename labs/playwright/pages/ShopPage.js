import { expect } from '@playwright/test';

// Page object for the demo shop. Locators are role- and label-based
// (getByRole / getByLabel), the way a user or a screen reader finds things -
// they survive CSS and layout changes that break `div > span:nth-child(2)`.
export class ShopPage {
  constructor(page) {
    this.page = page;
    this.search = page.getByLabel('Search books');
    this.books = page.locator('#book-list li');
    this.subtotal = page.getByTestId('subtotal');
    this.shipping = page.getByTestId('shipping');
    this.total = page.getByTestId('total');
    this.cartError = page.getByRole('alert');
    this.question = page.getByLabel('Your question');
    this.askButton = page.getByRole('button', { name: 'Ask' });
    this.answer = page.locator('#assistant-answer');
    this.recommendations = page.getByRole('heading', { name: 'Recommended for you' }).locator('..').getByRole('listitem');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.books.first()).toBeVisible();
  }

  async searchFor(text) {
    await this.search.fill(text);
  }

  addToCartButton(title) {
    return this.page.getByRole('button', { name: `Add ${title} to cart` });
  }

  async addToCart(title, times = 1) {
    for (let i = 0; i < times; i++) await this.addToCartButton(title).click();
  }

  async ask(question) {
    await this.question.fill(question);
    await this.askButton.click();
    await expect(this.answer).not.toHaveText(/^(|Thinking…)$/);
    return this.answer.textContent();
  }
}
