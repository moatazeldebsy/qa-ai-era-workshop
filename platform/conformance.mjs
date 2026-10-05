// The platform's conformance kit (Topic 13): the standards every HTTP
// service in the organisation must meet, as executable checks.
//
//   checkService(app)          → [{ id, title, ok, problem }] for one service
//   conformanceTests(name, makeApp)   registers node:test tests for a service
//
// Teams run conformanceTests in their own suites; the platform runs
// checkService across the whole fleet (labs/13-platform/fleet.mjs).
import http from 'node:http';

export const STANDARDS = [
  {
    id: 'health',
    title: 'GET /health answers 200 with JSON',
    check: async (url) => {
      const res = await fetch(`${url}/health`);
      if (res.status !== 200) return `status ${res.status}`;
      if (!/application\/json/.test(res.headers.get('content-type') ?? '')) return `content-type ${res.headers.get('content-type')}`;
    },
  },
  {
    id: 'request-id',
    title: 'Echoes x-request-id, so logs can be joined across services',
    check: async (url) => {
      const res = await fetch(`${url}/health`, { headers: { 'x-request-id': 'conformance-123' } });
      if (res.headers.get('x-request-id') !== 'conformance-123') return `got ${res.headers.get('x-request-id')}`;
    },
  },
  {
    id: 'security-headers',
    title: 'Sets nosniff and a Content-Security-Policy, and hides the framework',
    check: async (url) => {
      const h = (await fetch(`${url}/health`)).headers;
      const missing = [];
      if (h.get('x-content-type-options') !== 'nosniff') missing.push('nosniff');
      if (!/default-src/.test(h.get('content-security-policy') ?? '')) missing.push('CSP');
      if (h.get('x-powered-by')) missing.push(`X-Powered-By: ${h.get('x-powered-by')} present`);
      if (missing.length) return missing.join(', ');
    },
  },
  {
    id: 'json-404',
    title: 'Unknown routes answer 404 with a JSON error, not an HTML page',
    check: async (url) => {
      const res = await fetch(`${url}/conformance/no-such-route`);
      if (res.status !== 404) return `status ${res.status}`;
      if (!/application\/json/.test(res.headers.get('content-type') ?? '')) return `content-type ${res.headers.get('content-type')}`;
    },
  },
  {
    id: 'json-client-errors',
    title: 'Malformed JSON gets a 4xx with a JSON error, never a 5xx or HTML',
    check: async (url) => {
      const res = await fetch(`${url}/health`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"broken":' });
      if (res.status < 400 || res.status >= 500) return `status ${res.status}`;
      if (!/application\/json/.test(res.headers.get('content-type') ?? '')) return `content-type ${res.headers.get('content-type')}`;
    },
  },
];

async function serve(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

export async function checkService(app) {
  const { url, close } = await serve(app);
  try {
    const results = [];
    for (const s of STANDARDS) {
      const problem = await s.check(url).catch((err) => `error: ${err.message}`);
      results.push({ id: s.id, title: s.title, ok: !problem, problem: problem ?? '' });
    }
    return results;
  } finally {
    await close();
  }
}

export async function conformanceTests(name, makeApp) {
  const { describe, test } = await import('node:test');
  const assert = (await import('node:assert/strict')).default;
  describe(`${name} meets the platform standards`, () => {
    for (const s of STANDARDS) {
      test(s.title, async () => {
        const result = (await checkService(makeApp())).find((r) => r.id === s.id);
        assert.ok(result.ok, result.problem);
      });
    }
  });
}
