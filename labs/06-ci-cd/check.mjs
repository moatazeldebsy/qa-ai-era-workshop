// npm run learn:check 6 — Topic 6: CI/CD and Continuous Testing.
import { pass, fail, node, nodeTest, read, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 6, title: 'CI/CD and Continuous Testing' };

const C = 'labs/06-ci-cd';

export const steps = [
  {
    id: '1',
    title: 'The pipeline runs fast checks first, the rest in parallel, then one verdict',
    run: () => {
      const { stages } = JSON.parse(read(`${C}/pipeline.json`));
      const byId = new Map(stages.map((s) => [s.id, { needs: [], ...s }]));
      const gate = byId.get('gate');
      if (!gate) return fail('there is no "gate" stage', 'keep the gate as the last stage');
      if (!gate.always) return fail('the gate does not run when a test stage fails', 'set "always": true so the gate still gives its verdict');
      const evidence = [...byId.keys()].filter((id) => id !== 'gate' && ![...byId.values()].some((s) => s.needs.includes(id)));
      const missing = evidence.filter((id) => !gate.needs.includes(id));
      if (missing.length) return fail(`the gate can start before ${missing.join(', ')} finished`, 'the gate must need every stage whose results it judges');
      const depth = (id) => 1 + Math.max(0, ...byId.get(id).needs.map(depth));
      const longest = Math.max(...[...byId.keys()].map(depth));
      if (longest > 3) return fail(`the longest chain of stages is ${longest} long`, 'which stages truly need each other? Aim for at most 3 in a row');
      const run = node([`${C}/pipeline.mjs`]);
      if (run.code) return fail('the pipeline fails', 'npm run ci:pipeline and read the failing stage');
      const { speedup } = JSON.parse(read('test-results/pipeline-run.json'));
      return pass(`longest chain ${longest} stages; speed-up ${speedup.toFixed(2)}×`);
    },
  },
  {
    id: '2',
    title: 'Impact analysis selects the suites that imports cannot see',
    run: () => {
      const select = (file) => {
        const out = JSON.parse(node([`${C}/impact.mjs`, '--json', file]).out);
        return out.suites.filter((s) => s.run).map((s) => s.suite);
      };
      const cases = [
        ['app/public/app.js', ['e2e'], []],
        ['app/src/server.js', ['api', 'e2e', 'contract'], []],
        ['services/inventory/src/app.js', ['contract', 'e2e'], []],
        ['docs/index.md', [], ['unit', 'e2e', 'api', 'contract']],
        ['package.json', ['unit', 'foundations', 'test-design', 'unit-component', 'contract', 'api', 'e2e'], []],
      ];
      for (const [file, mustRun, mustSkip] of cases) {
        const chosen = select(file);
        const missed = mustRun.filter((s) => !chosen.includes(s));
        if (missed.length) return fail(`a change to ${file} skips ${missed.join(', ')}`, 'add a rule in impact.config.json for what that suite really depends on');
        const extra = mustSkip.filter((s) => chosen.includes(s));
        if (extra.length) return fail(`a change to ${file} runs ${extra.join(', ')}`, 'a rule is too broad: docs changes shouldn\'t run test suites');
      }
      return pass('front end, server, inventory, docs and dependency changes all select the right suites');
    },
  },
  {
    id: '3',
    title: 'The gate blocks mostly-skipped runs and stale evidence',
    run: () => {
      const a = nodeTest(`${C}/acceptance/gate.acceptance.js`);
      if (a.fail) return fail(`${a.fail} of ${a.tests} gate acceptance checks fail`, 'add a skipped-tests limit and an evidence freshness check to gate.mjs (lab step 3)');
      const t = nodeTest(`${C}/tests/*.test.js`);
      if (t.todo || t.fail) return fail('gate.test.js still has a TODO or a failure', 'turn both TODOs into real tests');
      return pass('skipped and stale evidence can no longer make a release "ready"');
    },
  },
  {
    id: '4',
    title: 'Notes: pipeline, impact analysis, gate and the planted regression',
    run: () => notebook('06', 'ci-notes.md'),
  },
];
