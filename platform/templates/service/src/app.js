import express from 'express';
import { useBaseline, useErrorHandling } from '../../../platform/express-baseline.mjs';

// {{name}}: created from the platform's service template (Topic 13).
// Add your routes between the two platform calls.
export function create{{Name}}App() {
  const app = express();
  useBaseline(app, { service: '{{name}}' });
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  useErrorHandling(app);
  return app;
}
