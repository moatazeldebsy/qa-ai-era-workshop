#!/usr/bin/env node
// npm run design:pairwise — the smallest-ish set of configurations in which
// every PAIR of factor values appears together at least once.
//
// Most interaction bugs involve two factors ("RTL layout breaks on mobile").
// Testing every combination grows multiplicatively; covering every pair grows
// roughly with the square of the largest factor. This is a small, deterministic
// greedy algorithm in the AETG family: start each row from an uncovered pair,
// then fill each remaining factor with the value that covers the most new
// pairs. Real tools (PICT, AllPairs, ACTS) produce slightly smaller sets and
// support constraints and higher strengths.
import { fileURLToPath } from 'node:url';

// The configurations Quality Books ships to. Edit this in the lab.
export const SHOP_FACTORS = {
  browser: ['chromium', 'firefox', 'webkit'],
  viewport: ['mobile', 'tablet', 'desktop'],
  locale: ['en-GB', 'de-DE', 'ar-EG'],
  assistant: ['mock', 'claude'],
  network: ['fast', 'slow-3g'],
};

const key = (i, a, j, b) => `${i}=${a}|${j}=${b}`;

export function allPairs(factors) {
  const names = Object.keys(factors);
  const values = names.map((n) => factors[n]);
  const pairsOf = (row) => {
    const keys = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        if (row[i] !== undefined && row[j] !== undefined) keys.push(key(i, row[i], j, row[j]));
      }
    }
    return keys;
  };

  const uncovered = new Set();
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      for (const a of values[i]) for (const b of values[j]) uncovered.add(key(i, a, j, b));
    }
  }

  const rows = [];
  while (uncovered.size) {
    const [seed] = uncovered;
    const [[i, a], [j, b]] = seed.split('|').map((p) => p.split('='));
    const row = [];
    row[i] = a;
    row[j] = b;
    for (let f = 0; f < names.length; f++) {
      if (row[f] !== undefined) continue;
      let best = values[f][0];
      let bestGain = -1;
      for (const v of values[f]) {
        row[f] = v;
        const gain = pairsOf(row).filter((k) => uncovered.has(k)).length;
        if (gain > bestGain) [best, bestGain] = [v, gain];
      }
      row[f] = best;
    }
    for (const k of pairsOf(row)) uncovered.delete(k);
    rows.push(Object.fromEntries(names.map((n, idx) => [n, row[idx]])));
  }
  return rows;
}

export const exhaustiveCount = (factors) => Object.values(factors).reduce((n, v) => n * v.length, 1);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = allPairs(SHOP_FACTORS);
  console.table(rows);
  console.log(`${rows.length} configurations cover every pair; all combinations would be ${exhaustiveCount(SHOP_FACTORS)}.`);
}
