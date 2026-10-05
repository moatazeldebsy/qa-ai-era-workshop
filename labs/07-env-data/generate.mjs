#!/usr/bin/env node
// npm run data:generate -- [count] [seed] — synthetic orders for tests.
//
// Synthetic data is invented, so it carries no personal data, and it's
// generated from the domain model, so every order is valid by construction:
// books that exist, quantities within stock, prices from priceCart. Orders
// come in a realistic mix of states, like a real shop's history.
import { fileURLToPath } from 'node:url';
import { books } from '../../app/src/catalog.js';
import { priceCart } from '../../app/src/cart.js';

const FIRST = ['Ada', 'Alan', 'Grace', 'Edsger', 'Barbara', 'Donald', 'Frances', 'Ken', 'Margaret', 'Tim', 'Radia', 'Linus'];
const LAST = ['Lovelace', 'Turing', 'Hopper', 'Dijkstra', 'Liskov', 'Knuth', 'Allen', 'Thompson', 'Hamilton', 'Berners-Lee', 'Perlman', 'Torvalds'];
// A typical shop's order history: mostly delivered, some in flight, some undone.
const STATES = [
  ['delivered', 70],
  ['paid', 8],
  ['shipped', 7],
  ['cancelled', 10],
  ['refunded', 5],
];

export function generateOrders({ count = 100, seed = 1 } = {}) {
  // mulberry32: a tiny, fast, seeded pseudo-random generator. Same seed, same
  // sequence, on every machine, so a failure found with seed 42 can be replayed.
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (list) => list[Math.floor(random() * list.length)];
  const weighted = (pairs) => {
    let r = random() * pairs.reduce((n, [, w]) => n + w, 0);
    for (const [value, w] of pairs) if ((r -= w) < 0) return value;
    return pairs.at(-1)[0];
  };
  const inStock = books.filter((b) => b.stock > 0);
  const customers = Array.from({ length: 30 }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    return { email: `${first}.${last}.${i}@example.com`.toLowerCase() };
  });

  return Array.from({ length: count }, (_, i) => {
    const shuffled = [...inStock];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }
    const items = shuffled.slice(0, 1 + Math.floor(random() * 3)).map((b) => ({ bookId: b.id, quantity: 1 + Math.floor(random() * Math.min(b.stock, 3)) }));
    const priced = priceCart(items, { bugMode: undefined });
    const placedAt = new Date(Date.UTC(2026, 0, 1) + Math.floor(random() * 270) * 86_400_000 + Math.floor(random() * 86_400_000));
    return {
      id: `ord-${String(i + 1).padStart(5, '0')}`,
      state: weighted(STATES),
      placedAt: placedAt.toISOString(),
      customer: pick(customers),
      lines: priced.lines,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
    };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [count = '20', seed = '1'] = process.argv.slice(2);
  console.log(JSON.stringify(generateOrders({ count: Number(count), seed: Number(seed) }), null, 2));
}
