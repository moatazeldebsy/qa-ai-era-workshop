import { fileURLToPath } from 'node:url';
import { createInventoryApp } from './app.js';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.INVENTORY_PORT) || 3220;
  createInventoryApp({ allowTestData: process.env.INVENTORY_TEST_DATA === 'on', token: process.env.INVENTORY_TOKEN }).listen(port, () => console.log(`Inventory service on http://localhost:${port}${process.env.INVENTORY_TEST_DATA === 'on' ? ' (test data API ON)' : ''}`));
}
