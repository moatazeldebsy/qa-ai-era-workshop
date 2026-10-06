// Reads the git-ignored .env file at the repo root into process.env, so a
// learner can keep their API key there instead of exporting it in every
// terminal (Topic 12's real-model routes).
//
// Only credentials and model names are read. The assistant's mode stays a
// per-command switch (ASSISTANT_MODE=claude npm start): in .env it would turn
// every npm start, npm test and eval into paid, non-deterministic model calls.
// Variables already set in the shell, or as a Codespaces secret, win.
import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

export const ENV_KEYS = ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'ASSISTANT_MODEL', 'TESTGEN_MODEL', 'AGENT_MODEL'];

export const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');

/** Returns the keys it set from the file, and the keys it ignored. */
export function loadEnvFile(file = envFile, env = process.env) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { loaded: [], ignored: [] };
    throw err;
  }
  const loaded = [];
  const ignored = [];
  for (const [key, value] of Object.entries(parseEnv(text))) {
    if (!ENV_KEYS.includes(key)) ignored.push(key);
    else if (value !== '' && env[key] === undefined) {
      env[key] = value;
      loaded.push(key);
    }
  }
  if (ignored.length) {
    console.warn(`.env: ignored ${ignored.join(', ')}. Only ${ENV_KEYS.join(', ')} are read from .env; set anything else per command, e.g. ASSISTANT_MODE=claude npm start`);
  }
  return { loaded, ignored };
}
