import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stock, reserve, release, ownBook } from './helpers.js';

// Owns its data: a book with 3 copies that no other test touches.
test('reserving the last copies of a book leaves none', async () => {
  const book = await ownBook(3);
  assert.equal(await stock(book), 3);
  const { status, body } = await reserve(book, 3);
  assert.equal(status, 201);
  assert.equal(await stock(book), 0);
  await release(body.reservationId);
});
