#!/usr/bin/env node
// npm run data:scan — is the masked export safe to copy to a test environment?
//
// 1. Leaks: does any personal value from the original export (names, emails,
//    phone numbers, streets, email user names) appear anywhere in the masked
//    files, including free text?
// 2. Re-identification: could someone with a list of customer emails
//    recompute the pseudonyms (a plain, unkeyed hash)?
// 3. Usefulness: do orders still join to customers, with every row kept?
// Exit code 1 if any check fails.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { parseCsv } from './csv.mjs';

const dir = 'labs/07-env-data';
const load = (sub, name) => {
  const file = path.join(dir, sub, name);
  if (!fs.existsSync(file)) {
    console.error(`✖ ${file} not found: run npm run data:mask first`);
    process.exit(1);
  }
  return { text: fs.readFileSync(file, 'utf8'), rows: parseCsv(fs.readFileSync(file, 'utf8')) };
};
const original = { customers: load('data', 'customers.csv').rows, orders: load('data', 'orders.csv').rows };
const masked = { customers: load('masked', 'customers.csv'), orders: load('masked', 'orders.csv') };
const everything = (masked.customers.text + masked.orders.text).toLowerCase();

const problems = [];

// 1. Leaks
const personal = original.customers.flatMap((c) => [
  ['name', c.name],
  ['email', c.email],
  ['email user name', c.email.split('@')[0]],
  ['phone', c.phone],
  ['phone digits', c.phone.replace(/\D/g, '').slice(-8)],
  ['street', c.street],
]);
const leaks = new Map();
for (const [kind, value] of personal) {
  if (value && everything.includes(value.toLowerCase())) leaks.set(`${kind}: ${value}`, true);
}
const digits = everything.replace(/[^0-9\n]/g, '');
for (const c of original.customers) {
  if (digits.includes(c.phone.replace(/\D/g, '').slice(-8))) leaks.set(`phone digits: ${c.phone}`, true);
}
if (leaks.size) problems.push(`${leaks.size} personal values leak into the masked files, e.g. ${[...leaks.keys()].slice(0, 4).join(' · ')}`);

// 2. Re-identification by recomputing an unkeyed hash
const recomputable = original.customers.filter((c) => {
  const h = crypto.createHash('sha256').update(c.email).digest('hex');
  return everything.includes(h.slice(0, 12));
});
if (recomputable.length) {
  problems.push(`${recomputable.length} pseudonyms are a plain SHA-256 of the email: anyone with the customer list can reverse them`);
}

// 3. Usefulness
const ids = new Set(masked.customers.rows.map((c) => c.email));
const orphans = masked.orders.rows.filter((o) => !ids.has(o.customer_email));
if (orphans.length) problems.push(`${orphans.length} of ${masked.orders.rows.length} orders no longer join to a customer`);
if (masked.customers.rows.length !== original.customers.length || masked.orders.rows.length !== original.orders.length) {
  problems.push('rows were added or lost');
}

if (problems.length) {
  console.log('✖ Not safe or not useful yet:\n');
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`✔ No personal values found, pseudonyms can't be recomputed without the key, and all ${orphans.length === 0 ? masked.orders.rows.length : 0} orders still join to their customers.`);
