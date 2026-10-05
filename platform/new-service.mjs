#!/usr/bin/env node
// npm run platform:new -- <name> — create a new service on the paved road.
//
// Copies platform/templates/service into services/<name>/ and adds a CI
// workflow that calls the platform's reusable workflow. The new service
// starts with the baseline, conformance tests and CI on day one.
//
//   --root <dir>   write somewhere else (tests use a temporary folder)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const root = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : path.resolve(here, '..');
const name = args.find((a, i) => !a.startsWith('--') && i !== rootIndex + 1);

if (!name) {
  console.error('usage: npm run platform:new -- <service-name>');
  process.exit(2);
}

const Name = name.replace(/(^|-)(\w)/g, (_, _dash, c) => c.toUpperCase());
const existing = fs.existsSync(path.join(root, 'services')) ? fs.readdirSync(path.join(root, 'services')) : [];
const port = 3300 + existing.length;
const fill = (text) => text.replaceAll('{{name}}', name).replaceAll('{{Name}}', Name).replaceAll('{{port}}', String(port));

const target = path.join(root, 'services', name);
const copy = (from, to) => {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      copy(src, dst);
    } else fs.writeFileSync(dst, fill(fs.readFileSync(src, 'utf8')));
  }
};
fs.mkdirSync(target, { recursive: true });
copy(path.join(here, 'templates/service'), target);
const workflow = path.join(root, '.github/workflows', `service-${name}.yml`);
fs.mkdirSync(path.dirname(workflow), { recursive: true });
fs.writeFileSync(workflow, fill(fs.readFileSync(path.join(here, 'templates/workflow.yml'), 'utf8')));

console.log(`Created services/${name}/ (port ${port}) and .github/workflows/service-${name}.yml`);
console.log(`Next: node --test "services/${name}/tests/*.test.js"`);
