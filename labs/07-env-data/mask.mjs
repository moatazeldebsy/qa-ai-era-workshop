#!/usr/bin/env node
// npm run data:mask — turn a production export into data a test environment
// may use. Reads labs/07-env-data/data/*.csv, writes labs/07-env-data/masked/.
//
// Written by a well-meaning developer on a Friday afternoon. Topic 7, lab
// step 4: find out what it gets wrong before anyone copies its output to a
// test environment.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { parseCsv, toCsv } from './csv.mjs';

const dir = 'labs/07-env-data';
const read = (name) => parseCsv(fs.readFileSync(path.join(dir, 'data', name), 'utf8'));

const customers = read('customers.csv').map((c, i) => ({
  ...c,
  name: `Customer ${i + 1}`,
  email: `${crypto.createHash('sha256').update(c.email).digest('hex').slice(0, 16)}@masked.example`,
  phone: '+49 *** ****',
  street: '***',
}));

const orders = read('orders.csv').map((o) => ({
  ...o,
  customer_email: o.customer_email.replace(/@.*/, '@masked.example'),
}));

fs.mkdirSync(path.join(dir, 'masked'), { recursive: true });
fs.writeFileSync(path.join(dir, 'masked', 'customers.csv'), toCsv(customers));
fs.writeFileSync(path.join(dir, 'masked', 'orders.csv'), toCsv(orders));
console.log(`Masked ${customers.length} customers and ${orders.length} orders → ${dir}/masked/`);
