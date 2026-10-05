#!/usr/bin/env node
// npm run platform:fleet — every service in the organisation against the
// platform standards, in one table. A platform team's first dashboard.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { STANDARDS, checkService } from '../../platform/conformance.mjs';

process.env.LOG_REQUESTS = 'false';
process.env.NODE_ENV ??= 'test'; // stop Express printing every handled error to the console
const fleet = [{ name: 'shop', make: async () => (await import('../../app/src/server.js')).createApp() }];
for (const dir of fs.readdirSync('services').sort()) {
  const file = path.resolve('services', dir, 'src/app.js');
  if (!fs.existsSync(file)) continue;
  fleet.push({
    name: dir,
    make: async () => {
      const mod = await import(pathToFileURL(file).href);
      const factory = Object.values(mod).find((v) => typeof v === 'function' && /^create\w*App$/.test(v.name));
      return factory();
    },
  });
}

const rows = [];
for (const s of fleet) rows.push({ name: s.name, results: await checkService(await s.make()) });

const width = Math.max(...rows.map((r) => r.name.length)) + 2;
console.log(`${'service'.padEnd(width)}${STANDARDS.map((s) => s.id.padEnd(20)).join('')}`);
for (const r of rows) console.log(`${r.name.padEnd(width)}${r.results.map((x) => (x.ok ? '✔' : '✖').padEnd(20)).join('')}`);
console.log('');
for (const r of rows) for (const x of r.results.filter((y) => !y.ok)) console.log(`✖ ${r.name}: ${x.id}: ${x.problem}`);
const passing = rows.filter((r) => r.results.every((x) => x.ok)).length;
console.log(`\n${passing}/${rows.length} services meet every standard.`);
