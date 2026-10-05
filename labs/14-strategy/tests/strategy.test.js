import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

// Learning Path, Topic 14 — a strategy is only as good as its evidence.

test('the scorecard builds from live evidence, with every section', () => {
  const res = spawnSync(process.execPath, ['labs/14-strategy/scorecard.mjs'], { encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const md = fs.readFileSync('test-results/scorecard.md', 'utf8');
  for (const section of ['Test portfolio', 'Risks and their evidence', 'Platform standards', 'Release gate', 'Production dependencies']) {
    assert.match(md, new RegExp(section), `missing section: ${section}`);
  }
});

// Found by reading the scorecard: the risk register said R6 ("pricing slows
// down") was covered. The check it pointed to only asks whether the cart
// answers 200, which a slow cart does too.
test(
  'every performance risk is traced to evidence that measures time',
  { todo: 'real gap: R6 is traced to a status check; Topic 14 lab, step 2' },
  () => {
    const { risks } = JSON.parse(fs.readFileSync('labs/01-foundations/risk-register.json', 'utf8'));
    for (const r of risks.filter((x) => x.attribute === 'Performance efficiency')) {
      assert.ok(
        r.checks.some((c) => /duration|p\(9\d\)|latency/i.test(c.title)),
        `${r.id} is traced to: ${r.checks.map((c) => c.title).join(', ')}`,
      );
    }
  },
);
