# Topic 6 · Concepts

## 1. What is it?

**Continuous integration (CI)** means every change is merged into a shared main branch frequently (at least daily), and every merge is automatically built and tested. **Continuous delivery (CD)** means every change that passes the pipeline is *releasable*: deploying it is a business decision, not an engineering project. **Continuous deployment** goes one step further: every change that passes is deployed to production automatically.

**Continuous testing** is the testing side of this: running the right automated checks at every stage, from a developer's laptop to production, so that each change gets fast, trustworthy feedback, and the release decision is based on evidence.

The vocabulary:

- **Pipeline:** the automated sequence of stages a change goes through, defined as code (`.github/workflows/ci.yml` in this repo).
- **Stage / job / step:** a stage groups work; a job runs on one machine (a **runner**); a step is one command.
- **Trigger:** what starts a pipeline: a push, a pull request, a schedule, a manual dispatch.
- **Artifact:** a file one stage produces for later stages or humans: a build, a test report, a trace.
- **Quality gate:** an automated decision point that turns evidence into *go* or *no go* against agreed thresholds.

## 2. Why do we need it?

Every quality practice in Topics 1–5 is only as good as how often it runs:

- **Small batches are safer.** A change of 50 lines that's tested within ten minutes is easy to understand and fix. A month of changes tested together is a debugging expedition. The DORA research programme found that teams deploying more often *also* have lower change failure rates: speed and stability go together when the pipeline is good.
- **Feedback decays.** A failure found in 5 minutes is fixed by the person who just wrote the code, while it's still in their head. Found in 5 days, it's someone else's archaeology.
- **Humans forget.** A checklist executed by people is skipped under pressure. A pipeline runs the same checks every time.
- **Releases need decisions, not opinions.** A gate with agreed thresholds replaces *"is it ready?"* debates with evidence.

Without it: integration hell before every release, long manual regression phases, and production as the place where bugs are found.

## 3. How does it work internally?

### A pipeline is a graph

A pipeline isn't a list, it's a **directed acyclic graph (DAG)**: stages with dependencies. A runner starts every stage whose dependencies have finished, up to the available concurrency.

![A pipeline as a graph: a push or pull request runs the unit stage first, then the foundations, test design and mutants, unit and Stryker, contract, and browser E2E and API stages in parallel; all of them feed a quality gate that always runs and either marks a release candidate or stops with reasons.](../../assets/diagrams/06-pipeline-dag.svg#only-light){ loading=lazy }
![A pipeline as a graph: a push or pull request runs the unit stage first, then the foundations, test design and mutants, unit and Stryker, contract, and browser E2E and API stages in parallel; all of them feed a quality gate that always runs and either marks a release candidate or stops with reasons.](../../assets/diagrams/06-pipeline-dag-dark.svg#only-dark){ loading=lazy }

The total time is set by the **critical path**: the longest chain of dependent stages. Adding machines only helps until the critical path is all that's left. That's why the lab measures it.

### What happens when a stage fails

- Stages that **need** the failed one are **skipped**: no point running E2E tests on code that doesn't compile.
- Independent stages keep running, so one run reports *all* the failures it can.
- Stages marked **always** run anyway. The quality gate must still give its verdict (*blocked, because…*) when tests fail. GitHub Actions calls this `if: always()`; this repo's `ci.yml` uses `continue-on-error` on evidence steps and lets the gate decide.

### Where the time goes

| Cost | Typical cause | Remedy |
|---|---|---|
| Queueing | Not enough runners | More runners, or fewer pipeline runs (merge queues) |
| Setup | Installing dependencies and browsers every time | Caching (`actions/setup-node` with `cache: npm`), pre-built images |
| Serial stages | Everything waits for everything | Model real dependencies; run the rest in parallel |
| One huge stage | The E2E suite runs on one machine | Sharding across machines |
| Running everything | Every test on every change | Test selection (impact analysis), tiered pipelines |
| Flaky reruns | Random failures, manual "re-run" | Fix flakiness; report retried passes |

### From change to production: tiers

Not every check runs on every event. A typical tiered design:

| When | What runs | Budget |
|---|---|---|
| Pre-commit / on save | Lint, type checks, affected unit tests | Seconds |
| Pull request | Unit, component, contract, selected E2E, quality gate | ≤ 10–15 minutes |
| Merge to main | Full suite, mutation testing on changed code, build and sign artefacts | ≤ 30 minutes |
| Nightly | Full mutation testing, full browser matrix, long load tests | Hours |
| Deployment | Smoke tests, canary analysis, synthetic checks | Minutes |
| Production | Monitoring, SLOs, synthetic journeys (Topic 10) | Continuous |

## 4. Main components and concepts

### 4.1 Pipeline design principles

1. **Fastest, most informative checks first.** Unit tests in seconds before E2E in minutes.
2. **Fail fast, but report everything you can.** Skip what depends on a failure; run what doesn't.
3. **Model real dependencies.** Two stages that only need the code can run at the same time.
4. **Same commands locally and in CI.** `npm test` on a laptop and in the pipeline, so a red build can be reproduced in one command.
5. **Hermetic and reproducible.** Pinned tool versions (this repo pins actions by commit SHA and k6 by version), lock files, containers. The same commit gives the same result.
6. **One verdict.** Many tools produce evidence; one gate makes the decision, with reasons.

### 4.2 Test selection and impact analysis

**Test impact analysis (TIA)** runs only the tests that a change could affect. The simplest approach, the one this lab builds, follows each test's imports to find the source files it depends on. Production systems add:

- **Coverage-based selection:** record which tests execute which code (per-test coverage), and select tests that touched the changed lines.
- **Build-graph selection:** tools like Bazel and Nx know every target's inputs and only re-run affected targets.
- **Predictive (ML) selection:** Meta (Facebook) published a system that learns from history which tests are likely to fail for a given change. It reported catching nearly all faulty changes while running a fraction of the tests.

TIA's weakness is everything a static graph can't see: tests that talk to the app over HTTP, configuration files, environment variables, data, the browser. The lab finds exactly that. The standard safety net: TIA on pull requests, **the full suite on main and nightly**.

### 4.3 Parallelism and sharding

- **Parallel stages:** independent stages run at the same time (the lab's pipeline).
- **Parallel workers:** a test runner runs files at the same time on one machine (Playwright's workers, `node --test`'s process per file).
- **Sharding:** split one suite across machines (`npx playwright test --shard=2/4`), then merge the reports.

Parallel work competes for CPU, memory and shared resources. The lab shows individual stages getting *slower* when they run together, even as the total gets faster. Tests that share state (a database, a port, a file) break when parallelised. That's a design problem to fix, not a reason to stay serial.

### 4.4 Flaky tests in the pipeline

The pipeline is where flakiness costs most: a random red blocks everyone and trains people to click "re-run". A healthy policy:

- at most **one** automatic retry, with "passed on retry" **reported as flaky**, not as green
- automatic **quarantine**: a known-flaky test moves to a non-blocking job with an owner and a deadline
- a **flaky rate** tracked per suite and per team (Topic 11)

### 4.5 Quality gates

A gate turns evidence into a decision. A good gate has:

| Property | Meaning | In this repo's gate |
|---|---|---|
| **Agreed thresholds as code** | The team's definition of "ready", versioned and reviewed | `gate.config.json` |
| **Required vs advisory checks** | What blocks, and what only informs | `required: true/false` |
| **Clear reasons** | Every block says which evidence and which threshold | The verdict table |
| **Trustworthy evidence** | The evidence is complete, fresh, and from *this* version of the code | **Missing**: the lab adds it |
| **Resistance to gaming** | You can't turn it green by skipping tests or deleting evidence | **Missing**: the lab adds it |

Evidence **provenance** matters: results should say which commit produced them (a SHA in the report, artefacts attached to the run). Stale results from an earlier build are one of the most common ways a gate approves something nobody tested.

### 4.6 Deployment strategies are testing strategies

| Strategy | How it works | Testing role |
|---|---|---|
| **Blue/green** | Two identical environments; switch traffic at once | Smoke-test green before the switch; instant rollback |
| **Canary** | Send a small share of traffic to the new version first | Compare its error rate and latency with the old version before widening |
| **Feature flags** | Deploy code dark; enable it per user, team or percentage | Test in production with real data, for a few users first; kill switch |
| **Progressive delivery** | Automated canary analysis widens or rolls back by itself | The pipeline continues into production, driven by metrics |
| **Staged rollout** | Rings of users or machines, one after another | Limits blast radius; CrowdStrike's 2024 incident is the cautionary tale of pushing to everyone at once |

### 4.7 Trunk-based development and merge queues

Long-lived branches delay integration, and with it the feedback. **Trunk-based development** keeps branches short (hours to a day) and relies on CI and feature flags. A **merge queue** tests each change *on top of* the changes ahead of it before merging, so main never breaks because two individually green changes conflict.

### 4.8 Pipeline security

The pipeline has access to your code, secrets and production, so it's a prime target:

- **Least privilege:** `permissions: contents: read` by default (this repo's `ci.yml`).
- **Pinned actions:** third-party actions pinned by commit SHA, not a moving tag.
- **No untrusted input in shell commands:** PR titles and branch names can contain shell syntax.
- **Secrets only where needed**, never available to pull requests from forks.
- **Supply chain:** signed artefacts (Sigstore/Cosign), provenance (SLSA), dependency and image scanning (Topic 9).

## 5. Architecture: this repo's pipeline

![This repo's pipeline: ci.yml is one job in feedback-speed order: setup, the doctor, unit tests, the topic labs, E2E and API tests, the agent tools, starting the app, the LLM eval and red team, the k6 smoke test, metrics, then the quality gate and an upload of every report. Other workflows: docs.yml builds, smoke-tests and deploys the site; learner-progress.yml writes the progress table in forks.](../../assets/diagrams/06-architecture.svg#only-light){ loading=lazy }
![This repo's pipeline: ci.yml is one job in feedback-speed order: setup, the doctor, unit tests, the topic labs, E2E and API tests, the agent tools, starting the app, the LLM eval and red team, the k6 smoke test, metrics, then the quality gate and an upload of every report. Other workflows: docs.yml builds, smoke-tests and deploys the site; learner-progress.yml writes the progress table in forks.](../../assets/diagrams/06-architecture-dark.svg#only-dark){ loading=lazy }

It's deliberately simple, one job in a sensible order. The lab's pipeline runner shows what you gain by modelling dependencies as a graph instead.

## 6. How it connects with other practices

| Practice | Connection |
|---|---|
| **Test levels (Topics 3–5)** | Define the stages and their order: cheapest and most informative first |
| **Mutation testing (Topics 2–3)** | Too slow for every push; incremental on PRs, full nightly |
| **Contracts (Topic 4)** | Consumer and provider pipelines connected through a broker and `can-i-deploy` |
| **Flakiness (Topic 5)** | The pipeline is where flakiness does its damage; retries must be visible |
| **Environments and data (Topic 7)** | Ephemeral environments per pull request; seeded data per run |
| **Performance (Topic 8)** | Smoke-level load tests per merge; full load tests nightly or before peak events |
| **Security (Topic 9)** | SAST, dependency and secret scanning as pipeline stages; signed artefacts |
| **Observability (Topic 10)** | Canary analysis and post-deploy checks continue the pipeline into production |
| **Metrics (Topic 11)** | DORA metrics (deployment frequency, lead time, change failure rate, time to restore) come from pipeline data |

## 7. Real-world examples

**1. The gate that trusted old evidence (this repo).** The course's quality gate reads whatever files are in `test-results/`. Run the load test on Monday, change the code on Tuesday, and on Wednesday the gate still reports Monday's numbers as a pass. In CI each run starts clean, so it hides there, but any local or long-lived runner shows it. On this machine, the reference fix immediately blocked a release because the LLM-eval and k6 results were days older than the code.

**2. Skip your way to green (this repo).** Mark 37 of 38 tests as skipped, and the course's quality gate says ✅ READY TO RELEASE. Nobody does this on purpose in a healthy team, but `test.skip` added "temporarily" to unblock a release, and never removed, is common. A gate needs a limit on skipped tests, or at least to report them loudly.

**3. Imports can't see a browser (this repo).** Change `app/public/app.js` and import-based impact analysis selects *zero* test suites. The E2E tests that caught Topic 5's race condition would never run. Every real TIA system has blind spots like this, which is why the full suite still runs on main.

**4. Knight Capital (2012).** One of eight servers didn't receive the new code during a manual deployment, and reactivated a dormant feature. A pipeline that deploys the same verified artefact everywhere, and verifies the deployment, is the control that was missing.

**5. Google TAP and test selection at scale.** Google's TAP (Test Automation Platform) runs tests for a monorepo with a huge rate of changes. It relies on build-graph dependencies to select affected tests, and batching to keep up. Even there, flakiness and selection blind spots are managed problems, not solved ones.

**6. CrowdStrike (2024), again.** A content update went to millions of machines at once. A staged rollout, ring by ring with automated health checks, is a continuous-testing control: it would have limited the damage to the first ring.

## 8. Scaling across applications and teams

| Challenge | What works |
|---|---|
| Every team builds its own pipeline from scratch | **Reusable workflows** and templates from a platform team (Topic 13), with sensible defaults: caching, sharding, gates, reports |
| Pipelines get slower every month | A **time budget** per stage, tracked like a product metric; TIA on PRs; sharding |
| Main breaks when green PRs collide | **Merge queues** |
| Hundreds of services, many versions | Contract brokers, `can-i-deploy`, versioned artefacts, deployment records |
| "Works in CI, fails locally" (or the reverse) | The same container images and commands everywhere; `npm run …` as the interface |
| Gate thresholds argued per release | Thresholds agreed once per product, reviewed quarterly, owned by the team |
| Visibility | A central dashboard of pipeline health: duration, flaky rate, failure causes (Topic 11) |

## 9. Security and data privacy

- **Secrets:** stored in the CI platform's secret store, scoped per environment, never echoed into logs, never available to untrusted pull requests.
- **Artefacts and logs:** test reports, traces and videos can contain personal data and tokens. Limit retention (this repo: 14 days) and access.
- **Third-party actions and images** run with your permissions. Pin them by SHA, review updates, prefer official ones.
- **Script injection:** never interpolate untrusted values (`github.event.pull_request.title`) straight into a shell command; pass them through environment variables.
- **Production access:** deployment credentials only in deployment jobs, with protected environments and required reviewers.
- **Tool telemetry:** some test tools send usage data by default (Pact does; this repo turns it off in CI with `PACT_DO_NOT_TRACK`).

## 10. Performance, maintenance, and cost

| Concern | Guidance |
|---|---|
| **Feedback time** | Aim for a pull-request pipeline under 10–15 minutes. Past that, people context-switch and batch changes. |
| **Compute cost** | Paid per runner-minute. Caching, TIA and tiering cut it; full matrices belong in nightly runs. |
| **Critical path** | Measure it. Parallelism beyond the critical path buys nothing. |
| **Pipeline as code** | Review it like code; test the risky parts (the lab tests the gate). |
| **Maintenance** | Pinned versions need regular, deliberate updates (Dependabot or Renovate for actions and packages). |
| **Flakiness tax** | Every flaky failure costs a re-run and some trust. Track and fix it. |

## 11. Common problems and failure scenarios

| Problem | Symptom | Fix |
|---|---|---|
| **Serial everything** | Slow pipeline with idle runners | Model real dependencies; parallelise |
| **No verdict on failure** | The gate is skipped when tests fail, so no clear reason is given | `always` / `if: always()` on the gate and report uploads |
| **Stale or partial evidence** | Green gate for untested code | Freshness and provenance checks; clean workspace per run |
| **Skipped tests ignored** | Green builds while coverage quietly erodes | Limits and reporting on skipped tests |
| **Retry-until-green** | Flaky tests never fixed | One retry, flaky reporting, quarantine with owners |
| **TIA blind spots** | Bugs slip through selective runs | Rules for runtime dependencies; full suite on main |
| **Works locally, fails in CI** | Different tool versions, time zones, CPU | Same versions, explicit time zones, containers |
| **Secrets in logs** | Credentials leak through debug output | Masking, no `set -x` around secrets, scoped tokens |
| **Gate thresholds nobody agreed** | Constant arguments; gates bypassed | Thresholds as code, owned and reviewed by the team |

## 12. Important trade-offs

- **Speed vs completeness.** Selective tests are fast and miss what the selection can't see; full suites catch more and cost time. Selective on PRs, full on main.
- **Fail fast vs report everything.** Stopping at the first failure saves compute; running independent stages reports more problems per run. Use dependencies for the first and parallelism for the second.
- **Strict vs advisory gates.** Strict gates stop bad releases and also block on noise; advisory checks inform without blocking. Make blocking checks reliable first.
- **Retries vs signal.** Retries keep the pipeline moving and hide flakiness. One visible retry is the usual compromise.
- **Monolithic vs per-service pipelines.** One pipeline is simple and slow to scale; many pipelines scale and need contracts and coordination.
- **Hosted vs self-hosted runners.** Hosted runners are clean and simple; self-hosted runners are faster and cheaper at scale, and need care with stale state and security.

## 13. Comparisons

### CI/CD platforms

| Platform | Model | Notes |
|---|---|---|
| **GitHub Actions** (this repo) | YAML workflows in the repo; hosted and self-hosted runners | Huge marketplace; reusable workflows; tight PR integration |
| **GitLab CI** | `.gitlab-ci.yml`; stages and DAG (`needs`) | Built-in environments, review apps, merge trains |
| **Jenkins** | Jenkinsfile (Groovy) pipelines; plugins | Very flexible, self-hosted; plugin maintenance is the cost |
| **CircleCI / Buildkite** | YAML; Buildkite runs agents on your infrastructure | Strong parallelism and test splitting |
| **Azure DevOps Pipelines** | YAML stages/jobs | Common in Microsoft-centric organisations |
| **Argo CD / Flux** | GitOps: the cluster pulls desired state from Git | Deployment side; pairs with any CI |

### Ways to select tests

| Approach | Finds affected tests by | Blind to |
|---|---|---|
| Run everything | — | Nothing, but slow |
| Path rules (`paths:` filters) | Folder patterns | Anything outside the patterns |
| Import graph (this lab) | Static imports | Runtime dependencies: HTTP, config, data |
| Build graph (Bazel, Nx, Turborepo) | Declared inputs of every target | Undeclared inputs |
| Per-test coverage | Which tests executed changed lines | New code paths, config, non-code changes |
| Predictive (ML) | Historical failure patterns | Novel kinds of change |
