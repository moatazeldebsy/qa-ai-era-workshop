import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stock, reserve, release, ownBook } from './helpers.js';

// Owns its data: a book with 3 copies that no other test touches.
test('releasing a reservation puts the copies back', async () => {
  const book = await ownBook(3);
  const held = await reserve(book, 1);
  assert.equal(await stock(book), 2);
  await release(held.body.reservationId);
  assert.equal(await stock(book), 3);
});
