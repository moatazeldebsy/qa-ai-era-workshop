import { test, expect } from '@playwright/test';

// Lab 2 - API tests with Playwright's request fixture. Same runner, reports and
// CI wiring as the UI tests, and an order of magnitude faster.

test.describe('GET /api/books', () => {
  test('returns the full catalogue with the documented shape', async ({ request }) => {
    const res = await request.get('/api/books');
    expect(res.status()).toBe(200);
    const { books } = await res.json();
    expect(books).toHaveLength(6);
    for (const book of books) {
      expect(book).toEqual({
        id: expect.any(Number),
        title: expect.any(String),
        author: expect.any(String),
        price: expect.any(Number),
        stock: expect.any(Number),
        tags: expect.any(Array),
      });
      expect(book.price).toBeGreaterThan(0);
    }
  });

  for (const [query, expected] of [
    ['k6', ['Performance Engineering with k6']],
    ['CHEN', ['Prompting for QA']],
    ['ai', ['Prompting for QA', 'Responsible AI Testing']],
    ['no-such-topic', []],
  ]) {
    test(`search "${query}" returns ${expected.length} result(s)`, async ({ request }) => {
      const res = await request.get('/api/books', { params: { q: query } });
      const { books } = await res.json();
      expect(books.map((b) => b.title)).toEqual(expected);
    });
  }
});

test.describe('GET /api/books/:id', () => {
  test('returns one book', async ({ request }) => {
    const res = await request.get('/api/books/3');
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).title).toBe('Prompting for QA');
  });

  test('404s for an unknown id', async ({ request }) => {
    const res = await request.get('/api/books/999');
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: 'book not found' });
  });
});

test('every response carries a request id for tracing', async ({ request }) => {
  const res = await request.get('/api/books', { headers: { 'x-request-id': 'lab-2-trace' } });
  expect(res.headers()['x-request-id']).toBe('lab-2-trace');
});
