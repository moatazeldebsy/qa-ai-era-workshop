// The platform's paved road for Express services (Topic 13).
//
// Every service calls useBaseline() right after creating its app, and
// useErrorHandling() just before returning it. The standards in
// platform/conformance.mjs are then met in ONE place, for every team, instead
// of being re-implemented (or forgotten) service by service.
//
//   const app = express();
//   useBaseline(app, { service: 'inventory' });
//   …routes…
//   useErrorHandling(app);
import crypto from 'node:crypto';

// APIs serve no pages, so nothing may load; a service that serves HTML passes
// its own policy (the shop's is "default-src 'self'", Topic 9).
const API_CSP = "default-src 'none'; frame-ancestors 'none'";

/** Cross-cutting behaviour for every request. */
export function useBaseline(app, { service = 'service', csp = API_CSP } = {}) {
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'x-request-id': req.get('x-request-id') || crypto.randomUUID(),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': csp,
      'Referrer-Policy': 'no-referrer',
    });
    res.locals.service = service;
    next();
  });
  return app;
}

/** Unknown routes and errors, as JSON. Register after all routes. */
export function useErrorHandling(app) {
  app.use((_req, res) => res.status(404).json({ error: 'not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    const status = err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500 && process.env.NODE_ENV !== 'test') {
      console.error(JSON.stringify({ level: 'error', service: res.locals.service, id: res.get('x-request-id'), message: err.message }));
    }
    // Client mistakes say what was wrong; server failures reveal nothing.
    res.status(status).json({ error: status === 500 ? 'internal error' : err.expose ? err.message : 'bad request' });
  });
  return app;
}
