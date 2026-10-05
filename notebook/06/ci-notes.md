# CI/CD and continuous testing notes

Topic 6. Reference answer (timings from a 4-core laptop).

## Step 1 — The pipeline

| | Before | After |
|---|---|---|
| Wall-clock time | 19.2 s | 10.2 s |
| Speed-up | 1.00× | 2.48× |
| Critical path | every stage, unit → … → gate | unit → test-design (or browser) → gate |

Why I kept `unit` first instead of running everything at once: it takes 0.3 s and checks the code every other stage depends on. If it fails, starting a minute of mutation and browser tests just wastes runners and hides the real failure in noise.

What happened to individual stage times when they ran in parallel, and why: they got slower (test-design 6.6 s → 9.1 s) because five stages shared four cores. The total still dropped because the stages overlap. With `PIPELINE_CONCURRENCY=2` the speed-up fell to about 1.7×.

## Step 2 — Test impact analysis

Which suites the import graph missed for a change to `app/public/app.js`, and why imports can't see them: all of them, including e2e, the only suite that tests that file. Playwright starts the app from `playwright.config.js` and talks to it over HTTP, so no test imports the front end or the server.

The rules I added, and one change my rules would still get wrong: e2e on `app/**` and `services/**`; api on `app/**`; both on `playwright.config.js` and their own folders; every suite on `package.json` and the lock file. Still wrong: a change to `app/openapi.yaml` runs the browser suites (the rule is too broad), and a change in `.nvmrc` (the Node version) runs nothing.

## Step 3 — The gate's blind spots

The skipped-test limit I chose, and why: 0. This suite has no skipped tests on purpose; known bugs use `test.fail()` or node:test TODOs, which are reported but still run. A team with legitimate platform-specific skips might allow a small number, but should name them.

How my freshness check decides that evidence is stale, and one way it could still be fooled: evidence older than the newest file in `app/` or `services/` is stale. It's still fooled by evidence that is newer than the code but from a different run: for example, `--reporter=list` writes no `junit.xml`, so the gate reads the previous run's file. The real fix is provenance: record the commit SHA and run id with the evidence, and start every run with an empty results folder.

## Step 4 — The planted regression

What the gate said with `BUG_MODE=cart`, and which evidence blocked it: ❌ BLOCKED on "Functional tests: 33/38 passed, 5 failed": the free-shipping UI test, the multi-book journey and three API pricing rows.
