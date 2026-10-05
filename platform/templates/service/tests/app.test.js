import { test } from 'node:test';
import assert from 'node:assert/strict';
import { create{{Name}}App } from '../src/app.js';

// {{name}}'s own behaviour. Replace with real tests as the service grows.
test('{{name}} reports healthy', async () => {
  const server = create{{Name}}App().listen(0);
  await new Promise((r) => server.once('listening', r));
  const res = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  server.close();
  assert.equal(res.status, 200);
});
