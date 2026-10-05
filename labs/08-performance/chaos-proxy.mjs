// A fault-injecting HTTP proxy, in the spirit of Toxiproxy (Topic 8).
//
// Put it between a client and a service, then make the network misbehave on
// purpose: add latency, or answer some requests with an error instead of
// forwarding them. Change the faults while traffic is flowing with set().
//
//   const proxy = await createChaosProxy({ target: 'http://127.0.0.1:3220' });
//   proxy.set({ latencyMs: 3000 });      // every call now takes 3 s
//   proxy.set({ failureRate: 0.5 });     // half the calls fail with a 503
import http from 'node:http';

export async function createChaosProxy({ target, latencyMs = 0, failureRate = 0, failStatus = 503, random = Math.random } = {}) {
  const faults = { latencyMs, failureRate, failStatus };
  const stats = { forwarded: 0, failed: 0 };

  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (faults.latencyMs) await new Promise((r) => setTimeout(r, faults.latencyMs));
    if (random() < faults.failureRate) {
      stats.failed += 1;
      res.writeHead(faults.failStatus, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'injected fault' }));
    }
    try {
      const upstream = await fetch(`${target}${req.url}`, {
        method: req.method,
        headers: { 'content-type': req.headers['content-type'] ?? 'application/json' },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      stats.forwarded += 1;
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    set: (changes) => Object.assign(faults, changes),
    stats,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
