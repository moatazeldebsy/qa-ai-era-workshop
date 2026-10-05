# Contributing

Thank you for helping make this course better. Every report of a broken step or a confusing sentence helps the next learner.

## Reporting a problem

Use the [issue templates](https://github.com/moatazeldebsy/qa-engineering-deep-dive/issues/new/choose):

- **Lab broken:** a command fails, or its output doesn't match the expected output in the docs. Please include the topic and step, your OS and Node version (`npm run learn:doctor`), the command, and its full output.
- **Content error:** something in the text is wrong, outdated or unclear.
- **Suggestion:** a new example, exercise, tool comparison or topic idea.

Questions about the material belong in [Discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions), under the topic's category.

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
npm install
npm run test:unit && npm test            # the demo app still works
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
