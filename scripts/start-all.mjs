#!/usr/bin/env node
// npm run start:all — the shop and the inventory service together, the way
// they run in "production". Ctrl+C stops both.
import { spawn } from 'node:child_process';

const services = [
  ['inventory', ['services/inventory/src/server.js']],
  ['shop', ['app/src/server.js']],
];
const children = services.map(([name, args]) => {
  const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => process.stdout.write(chunk.toString().replace(/^(?=.)/gm, `[${name}] `)));
  }
  child.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
    shutdown(code ?? 1);
  });
  return child;
});

function shutdown(code = 0) {
  for (const c of children) if (c.exitCode === null) c.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
