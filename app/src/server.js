import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { books, findBook, searchBooks } from './catalog.js';
import { priceCart, ValidationError } from './cart.js';
import { answer } from './assistant.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// Tiny in-process metrics, exposed in Prometheus text format at /metrics so the
// observability module has something real to scrape and graph.
const metrics = { requests: new Map(), errors: 0, assistantCalls: 0 };

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

  app.use((req, res, next) => {
    const id = req.get('x-request-id') || crypto.randomUUID();
    const start = process.hrtime.bigint();
    res.set('x-request-id', id);
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const key = `${req.method} ${req.route?.path ?? req.path} ${res.statusCode}`;
      metrics.requests.set(key, (metrics.requests.get(key) ?? 0) + 1);
      if (res.statusCode >= 500) metrics.errors += 1;
      if (process.env.LOG_REQUESTS !== 'false' && req.path.startsWith('/api')) {
        console.log(JSON.stringify({ level: 'info', id, method: req.method, path: req.path, status: res.statusCode, ms: Math.round(ms) }));
      }
    });
    next();
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/books', (req, res) => {
    res.json({ books: searchBooks(req.query.q) });
  });

  app.get('/api/books/:id', (req, res) => {
    const book = findBook(req.params.id);
    if (!book) return res.status(404).json({ error: 'book not found' });
    res.json(book);
  });

  app.post('/api/cart/price', (req, res) => {
    try {
      res.json(priceCart(req.body?.items));
    } catch (err) {
      if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
      throw err;
    }
  });

  // Deliberately slow and variable (200-1500 ms). Lab 4 uses it: a test that
  // sleeps a fixed time before asserting on it is flaky; one that waits for
  // the element is not.
  app.get('/api/recommendations', async (_req, res) => {
    const delay = Number(process.env.RECOMMENDATIONS_DELAY_MS) || 200 + Math.floor(Math.random() * 1300);
    await new Promise((r) => setTimeout(r, delay));
    res.json({ books: books.filter((b) => b.tags.includes('ai')).map(({ id, title }) => ({ id, title })) });
  });

  app.post('/api/assistant', async (req, res, next) => {
    try {
      metrics.assistantCalls += 1;
      res.json(await answer(req.body?.question));
    } catch (err) {
      next(err);
    }
  });

  app.get('/metrics', (_req, res) => {
    const lines = [
      '# HELP http_requests_total Requests by method, route and status.',
      '# TYPE http_requests_total counter',
      ...[...metrics.requests].map(([k, v]) => {
        const [method, route, status] = k.split(' ');
        return `http_requests_total{method="${method}",route="${route}",status="${status}"} ${v}`;
      }),
      '# TYPE http_server_errors_total counter',
      `http_server_errors_total ${metrics.errors}`,
      '# TYPE assistant_calls_total counter',
      `assistant_calls_total ${metrics.assistantCalls}`,
    ];
    res.type('text/plain').send(lines.join('\n') + '\n');
  });

  app.use(express.static(path.join(here, '..', 'public')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(JSON.stringify({ level: 'error', message: err.message }));
    res.status(500).json({ error: 'internal error' });
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3210;
  createApp().listen(port, () => {
    console.log(`Quality Books on http://localhost:${port} (assistant: ${process.env.ASSISTANT_MODE || 'mock'}, bug mode: ${process.env.BUG_MODE || 'off'})`);
  });
}
