import { fileURLToPath } from 'node:url';
import { create{{Name}}App } from './app.js';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || {{port}};
  create{{Name}}App().listen(port, () => console.log(`{{name}} on http://localhost:${port}`));
}
