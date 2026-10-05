# Topic 13 · Lab

## 14. Hands-on lab: building the paved road

You'll measure the fleet against the platform's standards, implement the shared baseline that meets them, move the inventory service onto it, fix the scaffolder, and create a brand-new service that conforms from its first commit.

**Time:** 2 hours

!!! abstract "Same routine as before"
    `npm run learn:start 13` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 13` to see what's left · thinking work goes in `notebook/13/platform-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `platform/conformance.mjs` | The platform standards as executable checks |
| `platform/express-baseline.mjs` | The paved-road library: a stub with TODOs (step 2) |
| `platform/templates/` | The service template and its CI workflow |
| `platform/new-service.mjs` | The scaffolder (step 4) |
| `.github/workflows/reusable-node-service.yml` | The reusable CI workflow every scaffolded service calls |
| `labs/13-platform/fleet.mjs` | Every service × every standard, in one table |
| `labs/13-platform/tests/platform.test.js` | Tests of the platform's own code; three TODOs |

### Step 0 — Baseline

```bash
npm run learn:start 13
mkdir -p notebook/13 && cp notebook/_templates/13/platform-notes.md notebook/13/
npm run platform:test
```

```text title="Expected output (summary)"
ℹ tests 5
ℹ suites 3
ℹ pass 2
ℹ fail 0
ℹ todo 3
```

### Step 1 — The fleet report (15 min)

Read the five standards in `platform/conformance.mjs`, then run them against every service:

```bash
npm run platform:fleet
```

```text title="Expected output (end)"
service    health              request-id          security-headers    json-404            json-client-errors
shop       ✔                   ✔                   ✖                   ✖                   ✖
inventory  ✔                   ✖                   ✖                   ✖                   ✖

✖ shop: security-headers: nosniff, CSP, X-Powered-By: Express present
✖ shop: json-404: content-type text/html; charset=utf-8
✖ shop: json-client-errors: status 500
✖ inventory: request-id: got null
✖ inventory: security-headers: nosniff, CSP, X-Powered-By: Express present
✖ inventory: json-404: content-type text/html; charset=utf-8
✖ inventory: json-client-errors: content-type text/html; charset=utf-8

0/2 services meet every standard.
```

Look closely at the last line. The inventory service doesn't answer broken JSON with a 500, like the shop: it answers with an **HTML page**. See it:

```bash
npm run start:inventory                                    # terminal 1
curl -s -X POST localhost:3220/reservations -H 'content-type: application/json' -d '{"oops":'
```

```text title="Expected output (excerpt)"
<pre>SyntaxError: Unexpected end of JSON input<br> &nbsp; &nbsp;at JSON.parse (&lt;anonymous&gt;)<br> &nbsp; &nbsp;at parse (<repo>/node_modules/body-parser/lib/types/jso…
```

Express's default error handler sends a stack trace, with absolute file paths, to the caller. In your notebook: which failure would a customer or an on-call engineer notice first, and why "every team fixes its own service" doesn't scale.

### Step 2 — Build the paved road (35 min)

`platform/express-baseline.mjs` is the library every service should call: `useBaseline(app)` first, `useErrorHandling(app)` last. Today both functions do nothing.

**Your task:** implement them so an app built on the baseline meets all five standards:

- `useBaseline`: hide `X-Powered-By`; echo or create `x-request-id`; set `X-Content-Type-Options: nosniff`, a `Content-Security-Policy` (APIs serve no pages, so `default-src 'none'` is a safe default, but let a service pass its own) and a `Referrer-Policy`.
- `useErrorHandling`: a JSON 404 for unknown routes; a JSON error handler that keeps Express's 4xx status for client mistakes, and answers `500 {"error":"internal error"}`, revealing nothing, for everything else.

Turn the first TODO in `platform.test.js` into a real test.

??? tip "Hint"
    It's the same middleware you may have written in Topics 4, 9 and 10, now in one place. `err.status` is set by Express for client mistakes; `err.expose` says whether the message is safe to show.

??? success "Reference solution"
    On the solutions branch: `git diff upstream/main upstream/solutions -- platform/express-baseline.mjs`. The error handler is the heart of it:

    ```js
    app.use((_req, res) => res.status(404).json({ error: 'not found' }));
    app.use((err, req, res, _next) => {
      const status = err.status >= 400 && err.status < 500 ? err.status : 500;
      res.status(status).json({ error: status === 500 ? 'internal error' : err.expose ? err.message : 'bad request' });
    });
    ```

### Step 3 — Adoption (15 min)

Move the inventory service onto the paved road: import the baseline in `services/inventory/src/app.js`, call `useBaseline(app, { service: 'inventory' })` right after `express()`, and `useErrorHandling(app)` just before `return app`. Run the fleet report again:

```text title="Expected output (end)"
✖ shop: security-headers: nosniff, CSP, X-Powered-By: Express present
✖ shop: json-404: content-type text/html; charset=utf-8
✖ shop: json-client-errors: status 500

1/2 services meet every standard.
```

Two lines of code fixed four standards. Turn the second TODO into a real test. In your notebook: what would it take to move the shop onto the road (it serves a web page, so its CSP must allow `'self'`), and what would make teams *want* to adopt the baseline?

### Step 4 — Internal tools are software too (25 min)

Scaffold a service the way a team would:

```bash
npm run platform:new -- recommendations
node --test "services/recommendations/tests/*.test.js"
```

```text title="Expected output"
Created services/recommendations/ (port 3301) and .github/workflows/service-recommendations.yml
```

It starts with the baseline, conformance tests and a CI workflow calling the reusable one. Run `npm run platform:fleet` again: three services now.

Now read `platform/new-service.mjs` and ask: what if someone types something odd? The third TODO in `platform.test.js` tries `../escape`, the name of an existing service, `Bad Name` and `x`, all in a temporary folder.

??? success "Reveal"
    The scaffolder joins the name to `services/` without checking it. `../escape` writes a service *outside* `services/`. An existing service's name copies the template into it, overwriting files with the same names. The scaffolder runs with the developer's permissions on the whole repository.

**Your task:** make the scaffolder refuse invalid names *before* writing anything: only lowercase letters, digits and single dashes, starting with a letter, 3–40 characters; never an existing service; never outside `services/`. Turn the TODO into a real test. Then delete `services/recommendations` and its workflow if you don't want to keep them.

??? success "Reference solution"
    ```js
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name) || name.length < 3 || name.length > 40) fail('…not a valid service name…');
    if (fs.existsSync(path.join(root, 'services', name))) fail(`services/${name} already exists`);
    if (!path.resolve(root, 'services', name).startsWith(path.resolve(root, 'services') + path.sep)) fail('the service must live inside services/');
    ```

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 13
```

```text title="Expected output"
✔ Step 2-4 — A working baseline, the inventory service on the paved road, and a safe scaffolder
    baseline meets every standard; inventory conforms; scaffolder refuses bad names and its services pass their tests
✔ Step 5 — Notes: the fleet, the paved road, adoption and internal tooling
    notebook/13/platform-notes.md

2/2 steps done for Topic 13: QA Platform Engineering and Test Infrastructure
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Commit and push to your fork. If you kept `services/recommendations`, its workflow will run in your fork's Actions tab: the reusable workflow in action.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `json-client-errors` still fails after step 2 | The error handler is registered before the routes, or has three parameters | Register it last, with four parameters `(err, req, res, next)` |
| `json-404` fails but other standards pass | `useErrorHandling` isn't called, or is called before `express.static` / the routes | Call it just before `return app` |
| The shop's page breaks after you adopt the baseline | `default-src 'none'` blocks its script and styles | Pass `{ csp: "default-src 'self'; frame-ancestors 'none'" }` |
| Topic 4's contract tests fail after step 3 | Unlikely: the baseline doesn't change successful responses. Check the import path | `../../../platform/express-baseline.mjs` from `services/inventory/src/` |
| A scaffolded service's tests can't find the platform | The service isn't under `services/` in this repository | Scaffold with `npm run platform:new`, from the repo root |
| The scaffolder refuses a name you think is fine | Uppercase, underscores, double dashes or under 3 characters | Use `kebab-case` |
| Express prints error stacks while you run the tests | Express logs handled errors unless `NODE_ENV=test` | The tests set it; set it yourself for manual runs |
