import crypto from 'node:crypto';
import express from 'express';

// The inventory service: a separate service, owned by a different team in
// the story, that the shop calls over HTTP to hold stock while a customer
// pays. Its API is published in services/inventory/openapi.yaml.
//
//   GET    /health
//   GET    /stock/:bookId              → 200 { bookId, available }       | 404
//   POST   /reservations { lines }     → 201 { reservationId, lines, expiresAt }
//                                       | 409 { error, bookId }         | 400
//   DELETE /reservations/:reservationId → 204                           | 404
//   PUT    /stock/:bookId { available } → 200   TEST ENVIRONMENTS ONLY (see below)
//
// State is in memory. `app.locals.reset(stock)` restores a known state, which
// tests and contract verification use to set up "provider states".

export const DEFAULT_STOCK = { 1: 12, 2: 0, 3: 5, 4: 8, 5: 3, 6: 7 };
const HOLD_MINUTES = 15;

// allowTestData switches on PUT /stock/:bookId, which lets a test create the
// stock it needs (Topic 7). It must never be on in production: anyone could
// set any stock level. INVENTORY_TEST_DATA=on enables it for a running server.
export function createInventoryApp({
  stock = DEFAULT_STOCK,
  clock = () => new Date(),
  newId = () => `res-${crypto.randomUUID()}`,
  allowTestData = false,
} = {}) {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

  let available;
  let reservations;
  app.locals.reset = (initial = stock) => {
    available = new Map(Object.entries(initial).map(([id, n]) => [Number(id), n]));
    reservations = new Map();
  };
  app.locals.reset();
  app.locals.reservations = () => reservations;

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/stock/:bookId', (req, res) => {
    const bookId = Number(req.params.bookId);
    if (!available.has(bookId)) return res.status(404).json({ error: `unknown book ${req.params.bookId}` });
    res.json({ bookId, available: available.get(bookId) });
  });

  if (allowTestData) {
    app.put('/stock/:bookId', (req, res) => {
      const bookId = Number(req.params.bookId);
      const n = req.body?.available;
      if (!Number.isInteger(bookId) || !Number.isInteger(n) || n < 0) return res.status(400).json({ error: 'available must be a whole number, 0 or more' });
      available.set(bookId, n);
      res.json({ bookId, available: n });
    });
  }

  app.post('/reservations', (req, res) => {
    const lines = req.body?.lines;
    const valid =
      Array.isArray(lines) &&
      lines.length > 0 &&
      lines.every((l) => Number.isInteger(l?.bookId) && Number.isInteger(l?.quantity) && l.quantity > 0);
    if (!valid) return res.status(400).json({ error: 'lines must be a non-empty array of { bookId, quantity }' });

    const short = lines.find((l) => (available.get(l.bookId) ?? 0) < l.quantity);
    if (short) return res.status(409).json({ error: 'insufficient stock', bookId: short.bookId });

    for (const l of lines) available.set(l.bookId, available.get(l.bookId) - l.quantity);
    const reservationId = newId();
    const expiresAt = new Date(clock().getTime() + HOLD_MINUTES * 60_000).toISOString();
    reservations.set(reservationId, { lines, expiresAt });
    res.status(201).json({ reservationId, lines, expiresAt });
  });

  app.delete('/reservations/:reservationId', (req, res) => {
    const held = reservations.get(req.params.reservationId);
    if (!held) return res.status(404).json({ error: 'no such reservation' });
    for (const l of held.lines) available.set(l.bookId, available.get(l.bookId) + l.quantity);
    reservations.delete(req.params.reservationId);
    res.status(204).end();
  });

  return app;
}
