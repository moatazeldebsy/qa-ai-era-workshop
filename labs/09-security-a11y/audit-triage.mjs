#!/usr/bin/env node
// npm run sec:audit — triage `npm audit` instead of panicking at its total.
//
// For each vulnerable package: how severe, is it reachable from PRODUCTION
// dependencies (shipped to customers) or only from development tools, is it
// direct or pulled in transitively, and what npm suggests as a fix (which
// may be a downgrade or a breaking change: read it before you run it).
//
// Policy (edit audit-policy.json): fail on any production vulnerability at
// or above `failOn`; development-only findings are reported for a decision.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const policy = JSON.parse(fs.readFileSync('labs/09-security-a11y/audit-policy.json', 'utf8'));
const audit = (args) => {
  try {
    return JSON.parse(execFileSync('npm', ['audit', '--json', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch (err) {
    return JSON.parse(err.stdout); // npm audit exits 1 when it finds anything
  }
};
const all = audit([]).vulnerabilities ?? {};
const prod = audit(['--omit=dev']).vulnerabilities ?? {};
const rank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

const rows = Object.values(all)
  .map((v) => ({
    name: v.name,
    severity: v.severity,
    scope: prod[v.name] ? 'PRODUCTION' : 'dev only',
    direct: v.isDirect ? 'direct' : 'transitive',
    via: (v.via ?? []).map((x) => (typeof x === 'string' ? x : x.title)).join('; '),
    fix: v.fixAvailable === true ? 'npm audit fix' : v.fixAvailable ? `${v.fixAvailable.name}@${v.fixAvailable.version}${v.fixAvailable.isSemVerMajor ? ' (breaking)' : ''}` : 'none yet',
  }))
  .sort((a, b) => rank[b.severity] - rank[a.severity] || a.scope.localeCompare(b.scope));

if (!rows.length) console.log('No known vulnerabilities in any dependency.');
for (const r of rows) {
  console.log(`${r.severity.toUpperCase().padEnd(9)} ${r.scope.padEnd(11)} ${r.direct.padEnd(11)} ${r.name}`);
  console.log(`          via: ${r.via.slice(0, 110)}`);
  console.log(`          fix: ${r.fix}`);
}
const blocking = rows.filter((r) => r.scope === 'PRODUCTION' && rank[r.severity] >= rank[policy.failOn]);
console.log(`\n${rows.length} vulnerable packages: ${rows.filter((r) => r.scope === 'PRODUCTION').length} in production dependencies, ${rows.filter((r) => r.scope !== 'PRODUCTION').length} in development tools only.`);
if (blocking.length) {
  console.log(`✖ ${blocking.length} production finding(s) at or above "${policy.failOn}": fix before release.`);
  process.exit(1);
}
console.log(`✔ Nothing in production at or above "${policy.failOn}". Decide on the development-only findings and record the decision.`);
