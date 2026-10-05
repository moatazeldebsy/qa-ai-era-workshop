import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { allPairs, exhaustiveCount, SHOP_FACTORS } from '../pairwise.mjs';

// Learning Path, Topic 2 — pairwise (combinatorial) testing.
//
// These tests check the GENERATOR, not the shop: that its output really covers
// every pair, and what it costs and misses compared with all combinations.

function uncoveredPairs(factors, rows) {
  const names = Object.keys(factors);
  const missing = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      for (const a of factors[names[i]]) {
        for (const b of factors[names[j]]) {
          if (!rows.some((r) => r[names[i]] === a && r[names[j]] === b)) missing.push(`${names[i]}=${a} + ${names[j]}=${b}`);
        }
      }
    }
  }
  return missing;
}

describe('pairwise generator', () => {
  const rows = allPairs(SHOP_FACTORS);

  test('every pair of values appears in at least one configuration', () => {
    assert.deepEqual(uncoveredPairs(SHOP_FACTORS, rows), []);
  });

  test('it needs far fewer configurations than all combinations', () => {
    // 3 × 3 × 3 × 2 × 2 = 108 combinations. The lower bound for pairs is
    // 3 × 3 = 9 (the two largest factors).
    assert.equal(exhaustiveCount(SHOP_FACTORS), 108);
    assert.ok(rows.length >= 9 && rows.length <= 15, `got ${rows.length} rows`);
  });

  test('every row is a valid configuration', () => {
    for (const r of rows) {
      for (const [name, vals] of Object.entries(SHOP_FACTORS)) assert.ok(vals.includes(r[name]), `${name}=${r[name]}`);
    }
  });

  test('the output is deterministic, so CI runs the same matrix every time', () => {
    assert.deepEqual(allPairs(SHOP_FACTORS), rows);
  });

  test('pairwise does NOT guarantee three-way combinations', () => {
    // The honest limit: some (browser, viewport, locale) triples are missing.
    // A bug that needs webkit + mobile + ar-EG together may not be covered.
    const triples = new Set(rows.map((r) => `${r.browser}/${r.viewport}/${r.locale}`));
    assert.ok(triples.size < 27, `${triples.size} of 27 triples covered`);
  });
});
