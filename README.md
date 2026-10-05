# QA Engineering Deep Dive

**Back to basics, all the way to leadership.**

A free, self-paced course in 14 topics for QA engineers, SDETs, developers and engineering leaders. Every topic explains the theory simply and in depth, then puts it to work in a lab on a real (small) system. You find real bugs, fix them, and an auto-checker tells you when you're done.

📖 **Course site:** <https://moatazeldebsy.github.io/qa-engineering-deep-dive/>

## The 14 topics

| # | Topic | In the lab you… |
|---|---|---|
| 1 | QA Engineering Foundations | Trace a risk register to real tests, and find a planted bug that most of the tests can't see |
| 2 | Test Design Techniques | Replace instinct with techniques (boundaries, decision tables, state models, properties, pairwise) and prove which tests catch bugs |
| 3 | Unit and Component Testing | Find real bugs behind 100% coverage, control time with test doubles, build a coupon module test-first, and raise the mutation score |
| 4 | Integration, API and Contract Testing | Test the API against its OpenAPI contract, and catch a mismatch between two services with Pact |
| 5 | UI, Web and End-to-End Testing | Make brittle tests resilient, turn a "flaky" test into a reliable reproduction, and run a pairwise browser matrix |
| 6 | CI/CD and Continuous Testing | Speed up a pipeline, build test impact analysis, and fix a quality gate fooled by skipped tests and stale results |
| 7 | Test Environments and Test Data | Make tests safe in parallel on a shared service, generate synthetic data that exposes a real bug, and fix a leaky masking script |
| 8 | Performance, Load and Resilience | Load-test checkout with k6, inject faults between services, and find a memory leak with a soak test |
| 9 | Security, Accessibility and Compatibility | Triage a real `npm audit`, harden HTTP responses, close an abuse case, and fix accessibility barriers automated rules miss |
| 10 | Production Quality and Observability | Correlate logs across services, fix a health check that lies, and measure SLOs and an error budget |
| 11 | Test Management and Quality Intelligence | Compute delivery metrics, build a test history, and find flakiness hidden by CI retries |
| 12 | AI in QA Engineering | Review AI-generated tests, evaluate and red-team an LLM feature, and let an agent explore the shop |
| 13 | QA Platform Engineering | Build a paved road: conformance checks, a shared baseline, and a safe service scaffolder |
| 14 | Quality Strategy and Leadership | Turn the evidence from Topics 1–13 into a quality strategy and a one-page update for leadership |

Each topic has the same four pages: **Overview → Concepts → Lab → Quiz & wrap-up**. Topics are independent: you can start with any of them.

## Your path through the course

### 1. Set up (15 minutes, once)

1. **Fork** this repository (the **Fork** button, top right). Your fork holds your lab work, your notes and your progress.
2. Open your fork in **GitHub Codespaces** (Code → Codespaces → Create codespace on main). Nothing to install: the dev container sets everything up. Or clone it locally:

    ```bash
    git clone https://github.com/<you>/qa-engineering-deep-dive.git
    cd qa-engineering-deep-dive
    nvm use                                  # Node 24
    npm install
    npx playwright install --with-deps chromium
    ```

3. Check your machine:

    ```bash
    npm run learn:doctor                     # ✅ / ❌ per tool, with the fix for anything missing
    ```

Full instructions: [Setup](https://moatazeldebsy.github.io/qa-engineering-deep-dive/start/setup/). No API key or cloud account is needed for any lab.

### 2. Study each topic (4–6 hours)

Every topic follows the same loop. Start with Topic 1, or pick a [route for your role](https://moatazeldebsy.github.io/qa-engineering-deep-dive/start/routes/).

| Step | Where | What you do |
|---|---|---|
| **Read** | The topic's **Overview** and **Concepts** pages on the [course site](https://moatazeldebsy.github.io/qa-engineering-deep-dive/topics/) | Learn the ideas: what it is, how it works inside, trade-offs, failure scenarios |
| **Start the lab** | Your terminal | `npm run learn:start 01` creates your own branch for the topic, starting from the course's unsolved state |
| **Do the lab** | The topic's **Lab** page | Each step gives you the task first. Try it, then open the folded hints (▸) if you need them |
| **Check** | Your terminal | `npm run learn:check 01` shows ✔ or ✖ per step, and what's missing. Run it as often as you like |
| **Write it down** | `notebook/01/` | The thinking work (risk notes, charters, a strategy) goes in your notebook, from the templates in `notebook/_templates/` |
| **Save** | Your fork | `git add -A && git commit -m "Topic 1 lab" && git push -u origin topic-01`. Your fork's **Actions** tab shows your progress table |
| **Test yourself** | The topic's **Quiz & wrap-up** page | Answer the quiz, read the explanations, then try the challenge |
| **Share** | [Discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions) | Post your challenge solution or notebook in the topic's category |

`npm run learn:status` shows your progress across all 14 topics. Topics are independent: an unfinished lab never blocks the next one.

### 3. When you're stuck

1. Re-read the step and its **Hint**.
2. Check the **Troubleshooting** table at the end of the lab page.
3. Compare with the reference solution: `git diff upstream/solutions -- <path>`. `learn:start` sets up the `upstream` remote (the course) and fetches its `solutions` branch for you.
4. Ask in [Discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions), in the topic's category.

## Discussions: questions and sharing

| Category | Use it for |
|---|---|
| **Topic 01 … Topic 14** | Questions about a topic; comparing notebooks and challenge solutions. Mark the answer that solved your problem |
| **Q&A** | Setup questions that don't belong to one topic |
| **Show your work** | Link your fork, a write-up, or a talk you gave about something from the course |
| **Study groups** | Find or start a group in your time zone or language |
| **Ideas** | Suggestions for new labs, examples or topics |

A good question includes the topic and step, the command you ran, its **full output**, and what you expected. The output of `npm run learn:check <topic>` is a great start.

Share solutions to the **challenges**, not to the labs: lab solutions are already one `git diff` away, while challenges have no reference answer on purpose, so comparing different answers is where the learning is.

Found a bug in a lab or the text, rather than a question? [Open an issue](https://github.com/moatazeldebsy/qa-engineering-deep-dive/issues/new/choose).

## Getting course updates

The course is fixed and improved over time. To bring updates into your fork:

```bash
git switch main
git pull upstream main
git push origin main
```

Your topic branches keep your work. New topics start from the updated `main` the next time you run `learn:start`.

## How you're supported

- **An auto-checker per topic** (`npm run learn:check NN`): runs your tests and checks your notes, and tells you what's missing.
- **Hints, then solutions:** every lab step has folded hints, and the `solutions` branch has every lab solved.
- **Quizzes** on each topic, which explain every answer. Your scores and finished pages are saved in your browser.
- **Your notebook** (`notebook/NN/`): by the end, a portfolio of how you reason about quality.
- **Progress in CI:** on every push, your fork's Actions tab shows a progress table. You may need to enable Actions on your fork first.

## The demo app: Quality Books

A small online bookshop (Express), built so every lab has something real to test. It has a catalogue, a cart with free shipping, orders and checkout, a separate inventory service, `/metrics`, and an AI support assistant with `mock`, `buggy` and `claude` modes. The bugs in it are real, and finding them is the point.

```bash
npm start            # http://localhost:3210
npm run start:all    # the shop and the inventory service
npm test             # E2E and API tests
npm run test:unit    # unit tests
```

## Repository layout

```text
app/                 the shop (Express): source, unit tests, OpenAPI spec
services/inventory/  the inventory service, a separate provider (Topic 4)
platform/            the platform's standards, baseline and scaffolder (Topic 13)
labs/NN-topic/       one folder per topic: lab files, tests, check.mjs
notebook/_templates/ templates for your notes, one folder per topic
scripts/learn.mjs    the course tooling: doctor, start, check, status
docs/                the course site (MkDocs Material)
.github/workflows/   CI, the docs site, and your fork's progress report
```

## Running it with a group

The course works for study groups, team training and workshops. See [For facilitators](https://moatazeldebsy.github.io/qa-engineering-deep-dive/reference/facilitators/).

## Contributing

Found a broken step, a wrong expected output or a confusing explanation? [Open an issue](https://github.com/moatazeldebsy/qa-engineering-deep-dive/issues/new/choose). Pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Everyone taking part agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE).
