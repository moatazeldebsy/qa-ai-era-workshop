// Helpers for tests that run against a SHARED inventory service (like a
// shared staging environment): INVENTORY_URL points at it.
export const INVENTORY = process.env.INVENTORY_URL ?? 'http://localhost:3220';

export async function stock(bookId) {
  const res = await fetch(`${INVENTORY}/stock/${bookId}`);
  return (await res.json()).available;
}

export async function reserve(bookId, quantity) {
  const res = await fetch(`${INVENTORY}/reservations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lines: [{ bookId, quantity }] }),
  });
  return { status: res.status, body: await res.json() };
}

export async function release(reservationId) {
  await fetch(`${INVENTORY}/reservations/${reservationId}`, { method: 'DELETE' });
}

/**
 * Create a book that only this test uses, with the stock it needs, through
 * the environment's test-data API. No other test can touch it, so tests can
 * run in parallel against a shared environment.
 */
export async function ownBook(available) {
  const bookId = 100_000 + Math.floor(Math.random() * 900_000);
  const res = await fetch(`${INVENTORY}/stock/${bookId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ available }),
  });
  if (!res.ok) throw new Error(`could not create test stock (${res.status}): is the test-data API on?`);
  return bookId;
}
