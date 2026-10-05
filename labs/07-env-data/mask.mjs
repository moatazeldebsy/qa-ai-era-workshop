#!/usr/bin/env node
// npm run data:mask — turn a production export into data a test environment
// may use. Reads labs/07-env-data/data/*.csv, writes labs/07-env-data/masked/.
//
//   MASK_KEY=<secret> npm run data:mask
//
// - Direct identifiers (name, phone, street) are replaced.
// - Emails become keyed pseudonyms (HMAC-SHA256 with MASK_KEY): the same
//   customer gets the same pseudonym in every table, so joins still work,
//   but nobody without the key can recompute them from a list of emails.
// - Free text is scrubbed: emails, phone numbers and every known customer
//   name are redacted, because people write personal data where you least
//   expect it.
// - City, postcode and country are kept: tests need realistic addresses.
//   (Combined with other fields they can still identify people: see the
//   Concepts page on quasi-identifiers.)
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { parseCsv, toCsv } from './csv.mjs';

const dir = 'labs/07-env-data';
const key = process.env.MASK_KEY;
if (!key) {
  console.error('✖ Set MASK_KEY to a secret (and keep it out of the repository): MASK_KEY=… npm run data:mask');
  process.exit(1);
}
const read = (name) => parseCsv(fs.readFileSync(path.join(dir, 'data', name), 'utf8'));
const pseudonym = (email) => `u_${crypto.createHmac('sha256', key).update(email.trim().toLowerCase()).digest('hex').slice(0, 12)}@masked.example`;

const rawCustomers = read('customers.csv');
const names = rawCustomers.flatMap((c) => [c.name, ...c.name.split(' ')]).filter((n) => n.length > 2).sort((a, b) => b.length - a.length);
const scrub = (text) => {
  let out = text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\+?\d[\d\s/-]{7,}\d/g, '[phone]');
  for (const n of names) out = out.replaceAll(n, '[name]');
  return out;
};

const customers = rawCustomers.map((c, i) => ({
  ...c,
  name: `Customer ${i + 1}`,
  email: pseudonym(c.email),
  phone: '+49 000 0000000',
  street: `Teststraße ${i + 1}`,
}));
const orders = read('orders.csv').map((o) => ({
  ...o,
  customer_email: pseudonym(o.customer_email),
  delivery_note: scrub(o.delivery_note),
}));

fs.mkdirSync(path.join(dir, 'masked'), { recursive: true });
fs.writeFileSync(path.join(dir, 'masked', 'customers.csv'), toCsv(customers));
fs.writeFileSync(path.join(dir, 'masked', 'orders.csv'), toCsv(orders));
console.log(`Masked ${customers.length} customers and ${orders.length} orders → ${dir}/masked/`);
