import { test, expect } from '@playwright/test';

// Contract-level checks on the assistant endpoint: status codes, shape and
// input limits. Whether the ANSWERS are good is an eval question (Lab 6).

test('returns an answer and the mode that produced it', async ({ request }) => {
  const res = await request.post('/api/assistant', { data: { question: 'What is your returns policy?' } });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ answer: expect.any(String), mode: expect.any(String) });
});

test('handles an empty question without calling a model', async ({ request }) => {
  const res = await request.post('/api/assistant', { data: { question: '   ' } });
  expect((await res.json()).answer).toBe('Please ask a question about our books or orders.');
});

test('rejects oversized input', async ({ request }) => {
  const res = await request.post('/api/assistant', { data: { question: 'a'.repeat(1001) } });
  expect((await res.json()).answer).toMatch(/too long/);
});
