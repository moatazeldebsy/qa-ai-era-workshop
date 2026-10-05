import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stock, reserve, release, ownBook } from './helpers.js';

// Owns its data: a book with 3 copies that no other test touches.
test('a reservation for more than is left is refused', async () => {
  const book = await ownBook(3);
  const first = await reserve(book, 2);
  assert.equal(first.status, 201);
  const second = await reserve(book, 2);
  assert.equal(second.status, 409);
  assert.equal(await stock(book), 1);
  await release(first.body.reservationId);
});
