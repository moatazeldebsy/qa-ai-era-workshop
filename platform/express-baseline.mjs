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

/** Cross-cutting behaviour for every request. */
export function useBaseline(app, { service = 'service' } = {}) {
  // TODO(Topic 13, step 2): request id, security headers, no X-Powered-By.
  void service;
  return app;
}

/** Unknown routes and errors, as JSON. Register after all routes. */
export function useErrorHandling(app) {
  // TODO(Topic 13, step 2): JSON 404 for unknown routes; JSON errors, keeping
  // Express's 4xx status for the client's mistakes.
  return app;
}
