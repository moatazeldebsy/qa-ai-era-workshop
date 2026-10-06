import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnvFile } from '../src/env.js';

// The .env loader: the API key comes from the file, but nothing that would
// quietly switch every run to a paid model, and the shell always wins.

const envFileWith = (text) => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qb-env-')), '.env');
  fs.writeFileSync(file, text);
  return file;
};

test('reads the API key and model names', () => {
  const env = {};
  const file = envFileWith('ANTHROPIC_API_KEY=sk-ant-test\nASSISTANT_MODEL="claude-opus-5-5"\n# a comment\n');
  assert.deepEqual(loadEnvFile(file, env).loaded, ['ANTHROPIC_API_KEY', 'ASSISTANT_MODEL']);
  assert.deepEqual(env, { ANTHROPIC_API_KEY: 'sk-ant-test', ASSISTANT_MODEL: 'claude-opus-5-5' });
});

test('never reads ASSISTANT_MODE, and says so', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const env = {};
  const result = loadEnvFile(envFileWith('ANTHROPIC_API_KEY=sk-ant-test\nASSISTANT_MODE=claude\n'), env);
  assert.equal(env.ASSISTANT_MODE, undefined);
  assert.deepEqual(result.ignored, ['ASSISTANT_MODE']);
  assert.match(warn.mock.calls[0].arguments[0], /ASSISTANT_MODE=claude npm start/);
});

test('a variable already set in the shell wins over the file', () => {
  const env = { ANTHROPIC_API_KEY: 'from-shell' };
  loadEnvFile(envFileWith('ANTHROPIC_API_KEY=from-file\n'), env);
  assert.equal(env.ANTHROPIC_API_KEY, 'from-shell');
});

test('an empty value, as in .env.example, sets nothing', () => {
  const env = {};
  assert.deepEqual(loadEnvFile(envFileWith('ANTHROPIC_API_KEY=\n'), env).loaded, []);
  assert.equal('ANTHROPIC_API_KEY' in env, false);
});

test('no .env file is fine', () => {
  assert.deepEqual(loadEnvFile(path.join(os.tmpdir(), 'qb-no-such-dir', '.env'), {}), { loaded: [], ignored: [] });
});
