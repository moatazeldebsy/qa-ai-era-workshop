import fs from 'node:fs';
import http from 'node:http';
import { parse } from 'yaml';
import Ajv from 'ajv/dist/2020.js';

// Shared helpers for Topic 4's tests.

/** Start an Express app on a random free port. Returns { url, close }. */
export async function serve(app) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** A URL where nothing is listening: a port that was free a moment ago. */
export async function deadUrl() {
  const { url, close } = await serve(http.createServer((_req, res) => res.end()));
  await close();
  return url;
}

/** POST JSON (or a raw string body) and return { status, body }. */
export async function post(url, body, { raw = false } = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ? body : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
}

export async function get(url) {
  const res = await fetch(url);
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
}

/**
 * A validator for one OpenAPI document: contract(path, method, status, body)
 * returns a list of problems (empty when the response matches the contract).
 */
export function openApiContract(file) {
  const doc = parse(fs.readFileSync(file, 'utf8'));
  const ajv = new Ajv({ strict: false, allErrors: true });
  return (path, method, status, body) => {
    const operation = doc.paths[path]?.[method];
    if (!operation) return [`${method.toUpperCase()} ${path} is not in the contract`];
    const response = operation.responses[String(status)];
    if (!response) return [`${method.toUpperCase()} ${path} has no documented ${status} response`];
    const schema = response.content?.['application/json']?.schema;
    if (!schema) return [];
    const validate = ajv.compile({ ...schema, components: doc.components });
    return validate(body) ? [] : validate.errors.map((e) => `${e.instancePath || '(body)'} ${e.message}`);
  };
}
