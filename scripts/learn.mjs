#!/usr/bin/env node
// The course's command-line companion.
//
//   npm run learn:doctor            is this machine ready?
//   npm run learn:start <topic>     new branch for a topic, from the course's starting state
//   npm run learn:check <topic>     check each lab step, with hints for what's missing
//   npm run learn:status [--json]   progress across every topic
//
// Maintainers (CI): node scripts/learn.mjs verify --expect incomplete|complete
//   main must ship every lab unsolved; the solutions branch must solve them all.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { root, sh } from './learn-kit.mjs';

const [command = 'help', ...args] = process.argv.slice(2);
const json = args.includes('--json');
const positional = args.filter((a) => !a.startsWith('--'));

// Learners work in a fork, whose `origin` only has main. `upstream` is the course
// itself: the starting state of every lab, and the `solutions` branch.
const COURSE_URL = 'https://github.com/moatazeldebsy/qa-engineering-deep-dive.git';
const isCourseRepo = (url) => /moatazeldebsy\/(qa-engineering-deep-dive|qa-ai-era-workshop)(\.git)?$/.test(url.trim());

function topicDirs() {
  return fs
    .readdirSync(path.join(root, 'labs'))
    .filter((d) => /^\d\d-/.test(d) && fs.existsSync(path.join(root, 'labs', d, 'check.mjs')))
    .sort();
}

function findTopic(arg) {
  const n = Number(arg);
  const dir = topicDirs().find((d) => Number(d.slice(0, 2)) === n);
  if (!Number.isInteger(n) || !dir) {
    console.error(`Unknown topic "${arg ?? ''}". Topics with a lab: ${topicDirs().map((d) => Number(d.slice(0, 2))).join(', ')}`);
    process.exit(2);
  }
  return dir;
}

async function runChecker(dir, { quiet = false } = {}) {
  const mod = await import(pathToFileURL(path.join(root, 'labs', dir, 'check.mjs')).href);
  const results = [];
  for (const step of mod.steps) {
    let result;
    try {
      result = await step.run();
    } catch (err) {
      result = { ok: false, detail: `checker error: ${err.message}`, hint: 'run the step by hand to see the full error' };
    }
    results.push({ id: step.id, title: step.title, ...result });
    if (!quiet) {
      console.log(`${result.ok ? '✔' : '✖'} Step ${step.id} — ${step.title}${result.detail ? `\n    ${result.detail}` : ''}`);
      if (!result.ok && result.hint) console.log(`    → ${result.hint}`);
    }
  }
  return { dir, ...mod.topic, done: results.filter((r) => r.ok).length, total: results.length, results };
}

const commands = {
  help() {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 11).join('\n').replace(/^\/\/ ?/gm, ''));
  },

  doctor() {
    const res = spawnSync(process.execPath, [path.join(root, 'scripts/doctor.mjs')], { stdio: 'inherit' });
    process.exit(res.status ?? 1);
  },

  start() {
    const dir = findTopic(positional[0]);
    const branch = `topic-${dir.slice(0, 2)}`;
    if (sh('git', ['status', '--porcelain']).out.trim()) {
      console.error('✖ You have uncommitted changes. Commit them (git add -A && git commit -m "wip") or stash them first.');
      process.exit(1);
    }
    let remotes = sh('git', ['remote']).out.split('\n');
    if (!remotes.includes('upstream') && !(remotes.includes('origin') && isCourseRepo(sh('git', ['remote', 'get-url', 'origin']).out))) {
      sh('git', ['remote', 'add', 'upstream', COURSE_URL]);
      console.log(`Added the course as the "upstream" remote: ${COURSE_URL}`);
      remotes = sh('git', ['remote']).out.split('\n');
    }
    const base = remotes.includes('upstream') ? 'upstream/main' : remotes.includes('origin') ? 'origin/main' : 'main';
    if (base !== 'main') {
      const remote = base.split('/')[0];
      sh('git', ['fetch', remote, 'main']);
      sh('git', ['fetch', remote, 'solutions']); // for the "compare with the solution" hints; optional
    }
    const exists = sh('git', ['rev-parse', '--verify', '--quiet', branch]).code === 0;
    const res = exists ? sh('git', ['switch', branch]) : sh('git', ['switch', '-c', branch, base]);
    if (res.code !== 0) {
      console.error(res.out);
      process.exit(1);
    }
    console.log(`${exists ? 'Back on' : 'Created'} branch ${branch}${exists ? '' : ` from ${base}`}.`);
    console.log(`Open the lab: docs/topics/${dir}/lab.md   ·   check your work: npm run learn:check ${Number(dir.slice(0, 2))}`);
  },

  async check() {
    const dir = findTopic(positional[0]);
    const r = await runChecker(dir);
    console.log(`\n${r.done}/${r.total} steps done for Topic ${r.id}: ${r.title}`);
    if (r.done === r.total) console.log('🎉 Lab complete. Next: the quiz and the challenge on the topic page.');
    process.exit(r.done === r.total ? 0 : 1);
  },

  async status() {
    const all = [];
    for (const dir of topicDirs()) all.push(await runChecker(dir, { quiet: true }));
    if (json) {
      console.log(JSON.stringify(all.map(({ results, ...t }) => ({ ...t, steps: results.map(({ id, ok }) => ({ id, ok })) })), null, 2));
      return;
    }
    console.log('Topic                                         Steps   Progress');
    for (const t of all) {
      const bar = '▓'.repeat(Math.round((t.done / t.total) * 10)).padEnd(10, '░');
      console.log(`${`${String(t.id).padStart(2)}. ${t.title}`.padEnd(46)}${`${t.done}/${t.total}`.padEnd(8)}${bar}${t.done === t.total ? ' ✔' : ''}`);
    }
  },

  // CI only: prove main still teaches (nothing solved) or solutions solves everything.
  async verify() {
    const expect = args[args.indexOf('--expect') + 1];
    if (!['complete', 'incomplete'].includes(expect)) {
      console.error('usage: learn.mjs verify --expect complete|incomplete');
      process.exit(2);
    }
    let bad = 0;
    for (const dir of topicDirs()) {
      const t = await runChecker(dir, { quiet: true });
      // "incomplete" = every step that needs the learner's work is still open.
      const ok = expect === 'complete' ? t.done === t.total : t.done < t.total;
      console.log(`${ok ? '✔' : '✖'} ${dir}: ${t.done}/${t.total}`);
      if (!ok) {
        bad += 1;
        for (const r of t.results.filter((x) => !x.ok)) console.log(`    Step ${r.id}: ${r.detail}`);
      }
    }
    process.exit(bad ? 1 : 0);
  },
};

if (!commands[command]) {
  console.error(`Unknown command "${command}".`);
  commands.help();
  process.exit(2);
}
await commands[command]();
