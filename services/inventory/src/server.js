import { fileURLToPath } from 'node:url';
import { createInventoryApp } from './app.js';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.INVENTORY_PORT) || 3220;
  createInventoryApp().listen(port, () => console.log(`Inventory service on http://localhost:${port}`));
}
