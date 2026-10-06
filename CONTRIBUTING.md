# Contributing

Thank you for helping make this course better. Every report of a broken step or a confusing sentence helps the next learner.

## Reporting a problem

Use the [issue templates](https://github.com/moatazeldebsy/qa-engineering-deep-dive/issues/new/choose):

- **Lab broken:** a command fails, or its output doesn't match the expected output in the docs. Please include the topic and step, your OS and Node version (`npm run learn:doctor`), the command, and its full output.
- **Content error:** something in the text is wrong, outdated or unclear.
- **Suggestion:** a new example, exercise, tool comparison or topic idea.

Questions about the material belong in [Discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions), under the topic's category.

## Repository layout

```text
app/                    Quality Books, the shop every lab tests
  src/                  server, business rules, clients for other services
  public/               the browser pages (shop, checkout, account)
  test/                 the shop's own tests: unit and API (node:test), e2e/ (Playwright)
  openapi.yaml          the shop's API contract
services/inventory/     a second service the shop calls (Topic 4)
docs/                   the course site (MkDocs)
  topics/NN-topic/      index, concepts, lab and quiz for topic NN
  start/, reference/    setup, routes, cheat sheet, glossary, demo app reference
labs/NN-topic/          the runnable lab for topic NN: check.mjs, tests/, acceptance/
notebook/_templates/NN/ notes templates for topic NN; learners write to notebook/NN/
platform/               the service template and conformance checks (Topic 13)
scripts/                learn.mjs (start, check, verify), doctor, start-all
tests/docs/             tests for the course site itself
```

**The topic number is the key.** Topic 5 lives in `docs/topics/05-ui-e2e/`, `labs/05-ui-e2e/` and `notebook/_templates/05/`. A new topic needs all three.

**Where a test goes:**

| The test checks… | Put it in | Runs with |
|---|---|---|
| The shop's own behaviour (not a lab exercise) | `app/test/` (`*.test.js`), or `app/test/e2e/` for the browser | `npm run test:unit`, `npm run test:shop` |
| Something a learner works on in topic NN | `labs/NN-topic/tests/` (or the folder the lab names) | the topic's npm script, e.g. `npm run unit:test` |
| That a lab is solved (used by `check.mjs`, not by learners) | `labs/NN-topic/acceptance/` | `npm run learn:check NN` |
| The course site (quizzes, progress) | `tests/docs/` | `npm run test:docs` |

**Three Playwright configs**, each with a reason:

- `playwright.config.js` covers the shop and lab projects (`e2e`, `api`, `a11y`, `shop`…). It starts the shop and the inventory service.
- `playwright.docs.config.js` covers the course site, which is a different app on a different server.
- `labs/05-ui-e2e/playwright.matrix.config.js` is the cross-browser matrix that Topic 5 teaches.

Paths are part of the course: lab steps, expected outputs, `check.mjs` files, `labs/06-ci-cd/impact.config.json` and the `solutions` branch all name files by path. Avoid moving or renaming files; if you must, update all of them in the same pull request.

## How the course is built

These rules keep the labs honest. Please follow them in pull requests.

1. **Main ships every lab unsolved.** Each lab contains real, unfixed findings. Known findings are recorded so the suites stay green:
    - node:test: `test('…', { todo: 'why it fails today' }, …)`
    - Playwright: `test.fail(true, 'why it fails today')`

    The learner removes the marker when they fix the finding.
2. **Topics are independent.** A lab may never depend on a fix from another topic's lab. Every learner starts each topic from `main`.
3. **Every topic has a checker:** `labs/NN-topic/check.mjs` exports `topic` and `steps: [{ id, title, run() }]`, where `run()` returns `{ ok, detail, hint }`. Thinking work is checked through the notebook (`notebook/NN/`), whose templates live in `notebook/_templates/NN/`.
4. **Expected outputs are real.** Every "Expected output" block in the docs is pasted from an actual run. If you change a lab, rerun its commands and update the blocks.
5. **Solutions live on the `solutions` branch,** one commit per topic (`solution: Topic N — …`), on top of `main`.

## Making a change

```bash
npm ci
npm run test:unit && npm test            # the demo app still works
npm run test:shop                        # the shop's customer journeys
node scripts/learn.mjs verify --expect incomplete   # every lab is still a lab on main
pip install -r requirements-docs.txt
mkdocs build --strict                    # the site builds without warnings
npm run test:docs                        # the site's quizzes and progress still work
```

If your change affects a lab's solution, update the `solutions` branch too:

```bash
git switch solutions
git rebase main                          # resolve conflicts topic by topic
node scripts/learn.mjs verify --expect complete     # every topic is complete
```

When a solution needs to change, amend that topic's commit (`git commit --fixup <sha>` then `git rebase -i --autosquash main`) so the branch keeps one commit per topic. CI checks both branches.

## Writing style

- Go deep, but explain simply. Introduce every unfamiliar term before you use it, and add it to `docs/reference/glossary.md` (kept in alphabetical order).
- Prefer a real finding in Quality Books over a made-up example.
- Short sentences, active voice, and no hype.
- Topic pages follow the 15-section structure: sections 1–13 in `concepts.md`, 14–15 in `lab.md`.

## Code of Conduct

Everyone taking part agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).
