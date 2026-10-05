// Helpers for the per-topic checkers (labs/NN-*/check.mjs). A checker exports
//   topic: { id, title }
//   steps: [{ id, title, run: async () => ({ ok, detail, hint }) }]
// and uses these helpers so every topic checks things the same way.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Marker used in notebook templates for "write your answer here". */
export const MARKER = '✏️';

export const pass = (detail = '') => ({ ok: true, detail });
export const fail = (detail, hint = '') => ({ ok: false, detail, hint });

/** Run a command from the repo root; returns { code, out } (stdout + stderr). */
export function sh(cmd, args = [], { env = {} } = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ...env },
    maxBuffer: 32 * 1024 * 1024,
  });
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
}

/** Run node scripts (an array of args after `node`). */
export const node = (args, opts) => sh(process.execPath, args, opts);

/** Run `node --test <glob>` and read the summary counts. */
export function nodeTest(glob, opts) {
  const { code, out } = node(['--test', glob], opts);
  const count = (name) => Number(out.match(new RegExp(`^# ${name} (\\d+)`, 'm'))?.[1] ?? NaN);
  return { code, out, tests: count('tests'), pass: count('pass'), fail: count('fail'), todo: count('todo') };
}

export const exists = (rel) => fs.existsSync(path.join(root, rel));
export const read = (rel) => (exists(rel) ? fs.readFileSync(path.join(root, rel), 'utf8') : '');

/**
 * A notebook page is done when the learner copied it from notebook/_templates
 * into notebook/<topic>/ and replaced every ✏️ marker with their own answer.
 */
export function notebook(topicDir, file) {
  const rel = `notebook/${topicDir}/${file}`;
  if (!exists(rel)) {
    return fail(`${rel} does not exist`, `mkdir -p notebook/${topicDir} && cp notebook/_templates/${topicDir}/${file} ${rel}, then fill it in`);
  }
  const left = read(rel).split(MARKER).length - 1;
  if (left) return fail(`${rel} still has ${left} ${MARKER} placeholder(s)`, `replace every ${MARKER} with your own answer`);
  return pass(rel);
}
