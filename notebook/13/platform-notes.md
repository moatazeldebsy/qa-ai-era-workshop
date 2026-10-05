# QA platform engineering notes

Topic 13. Reference answer.

## Step 1 — The fleet report

Which standards each service failed, and which of those failures a customer or an on-call engineer would notice first: on the starting code, the shop failed security headers, JSON 404s and JSON client errors; the inventory service failed request ids, security headers, JSON 404s and JSON client errors. An on-call engineer notices the shop's 500s for broken JSON first (they page someone for a client's mistake). An attacker notices the inventory's HTML error page first: it contains a stack trace and file paths.

Why "every team fixes its own service" doesn't scale to 50 services: each team re-implements the same middleware slightly differently, so fixes have to be found, written and reviewed fifty times, and every new service starts with the same gaps. Nobody can even tell which services are fixed without auditing each one.

## Step 2 — The paved road

What the baseline does, and one standard I'd add to it next (and why it belongs in the platform, not in each service): it hides the framework, echoes or creates request ids, sets nosniff, a CSP and a Referrer-Policy, answers unknown routes with a JSON 404, and turns errors into JSON (4xx with a safe message, 500 with none). Next I'd add a `/ready` endpoint with pluggable dependency checks: every service needs one (Topic 10), the timeout logic is easy to get wrong, and load balancers depend on it behaving the same everywhere.

How I made sure the baseline itself is correct (tests of the platform's own code): `platform.test.js` checks that a bare Express app fails every standard (so the kit can detect problems) and that an app built on the baseline passes every one; the acceptance checks add a route that throws (500, no secrets in the body) and one that throws a 422 (message kept).

## Step 3 — Adoption

What it took to move the inventory service onto the paved road (lines changed), and what it would take for the shop: three lines (an import, `useBaseline` after `express()`, `useErrorHandling` before `return app`), and four standards went from failing to passing. The shop needs the same calls with its own CSP (`default-src 'self'`) because it serves a web page, and it should delete its own header, 404 and error middleware afterwards; its tests are the safety net for that.

What would make teams *want* to adopt the baseline rather than be forced to: it removes code they'd otherwise maintain, it makes their pages and alerts quieter (no 500s for client mistakes), the fleet report shows their service going green, and the platform team does the upgrade PRs for them.

## Step 4 — The scaffolder

What a careless name could have done before my fix, and the rule I chose for valid names: `../escape` wrote a service outside `services/`; the name of an existing service copied template files into it, overwriting `src/app.js` and its tests. Now names must be kebab-case, 3–40 characters, start with a letter, must not already exist, and must resolve inside `services/`, all checked before anything is written.

The reusable CI workflow: what changes for 50 services when the platform team improves it? What could go wrong? Every service gets the improvement (a faster cache, a new security scan, a newer Node version) on its next run, with no change in its repository. That's also the risk: a mistake breaks fifty pipelines at once, so the workflow needs its own tests, versioned releases (services can pin `@v2`), and a gradual rollout.
