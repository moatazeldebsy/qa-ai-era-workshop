# Topic 11 · Concepts

## 1. What is it?

**Test management** is how a team plans, organises, runs and tracks its testing: what's covered, what ran, what failed, who owns what. **Quality intelligence** goes a step further: it turns the data that testing and production produce (results, durations, flakiness, coverage, mutation scores, defects, incidents, deployments) into **insight and decisions**. Where to invest, what to fix first, whether quality is improving, and whether to release.

The raw material:

- **Test results over time:** pass and fail per test per run, durations, retries, error messages.
- **Test assets:** what tests exist, what they cover (requirements, risks, code), who owns them.
- **Defects:** where they were found, how severe, which test layer should have caught them.
- **Delivery and operations data:** deployments, lead times, incidents, detection and restore times (Topic 10).

And the outputs: **metrics** (numbers with definitions), **reports and dashboards** (for a specific audience), and **decisions** (fix, quarantine, invest, release).

## 2. Why do we need it?

- **One run is an anecdote; history is evidence.** A test that fails today might be a regression, a flaky test, or a broken environment. Only its history tells you which. In this lab, a report based on the latest run calls the same flaky test "failing" or "fine" depending on luck.
- **Tooling can hide the truth.** With retries enabled, JUnit (the format most CI tools read) reports a test that failed and then passed as a plain pass. The flakiness is invisible to dashboards and quality gates built on it.
- **Testing has costs that compound.** Slow, flaky and duplicated tests cost every developer, every run. You can't reduce costs you don't measure.
- **Leaders need decision-grade information.** "Are we getting better?", "Where do defects escape?", "Can we ship?" need trustworthy numbers, with their limitations stated.
- **Metrics change behaviour.** Measuring the wrong thing (test counts, bugs found per tester) makes teams optimise the wrong thing. Choosing and defining metrics is a quality skill in itself.

## 3. How does it work internally?

### The data pipeline

![The quality data pipeline: CI results, production signals and tracker data go into a results store with one row per test per run, analysis finds flakiness, trends, clusters, escapes and DORA metrics, reports are shaped for developers, teams or leadership, and decisions (fix, quarantine, invest, release) feed new tests and rules back into CI.](../../assets/diagrams/11-data-pipeline.svg#only-light){ loading=lazy }
![The quality data pipeline: CI results, production signals and tracker data go into a results store with one row per test per run, analysis finds flakiness, trends, clusters, escapes and DORA metrics, reports are shaped for developers, teams or leadership, and decisions (fix, quarantine, invest, release) feed new tests and rules back into CI.](../../assets/diagrams/11-data-pipeline-dark.svg#only-dark){ loading=lazy }

1. **Collect** every run's results, not just the latest, with context: commit, branch, environment, retry count. The lab's `collect.mjs` keeps JUnit and Playwright JSON per run.
2. **Normalise** them into one shape: one record per test per run, with a stable test id (file › describe › title).
3. **Analyse** across runs: pass rate per test, flakiness (different outcomes on the same code), duration trends, failure clusters, escapes by layer.
4. **Report** to an audience, with definitions and caveats.
5. **Decide and act**, and check the effect in the next period.

### Detecting flakiness

| Signal | Detects | Misses |
|---|---|---|
| Latest run only | Nothing about flakiness | Everything (the lab's first version) |
| Passed on retry within a run (Playwright's `flaky` status) | Flakiness CI absorbed with retries | Flaky tests that never got a retry |
| Different outcomes for the same test on the same commit across runs | Most flakiness | Tests that rarely flake (need many runs) |
| Re-running failures on the same code automatically | Confirms suspected flakes | Costs compute |

A test that **always** fails on a commit isn't flaky; it's failing, and needs a different response. Mixing them up wastes time in both directions.

### Standard result formats

| Format | Strengths | Limits |
|---|---|---|
| **JUnit XML** | Read by almost every CI tool and dashboard | No standard for retries or flakiness; a retried pass looks like a pass |
| **Playwright JSON** (and similar runner-native formats) | Every attempt, statuses (`flaky`, `expected`), annotations, attachments | Tool-specific |
| **TAP** | Simple, streaming (node:test's default when piped on Node 22) | Little metadata |
| **CTRF, Allure results** | Richer common formats, with retries and history | Need adoption on both sides |

## 4. Main components and concepts

### 4.1 Test management basics

- **Test inventory:** what tests exist, at which level, for which feature or risk, owned by whom.
- **Traceability:** links from requirements and risks to tests and results (Topic 1's risk register is a small version).
- **Test plans and runs:** for manual and exploratory testing, records of what was tested, by whom, with what findings (charters from Topic 1).
- **Ownership:** every suite, and every flaky or failing test, has an owner and a deadline.

### 4.2 Metrics: a short field guide

| Metric | Measures | Good for | Gamed or misread when |
|---|---|---|---|
| **Pass rate** | Share of tests passing | Spotting broken builds | Failing tests are skipped or deleted |
| **Flaky rate** | Share of tests or runs with non-deterministic results | Suite health, developer trust | Retries hide it; too few runs |
| **Suite duration / p95** | Feedback time | Pipeline budgets | Parallelism hides slow tests |
| **Coverage** | Code executed by tests | Finding untested code | Used as a target (Topic 3) |
| **Mutation score** | Tests' ability to detect injected faults | Test strength | Applied to trivial code |
| **Defect escape rate** | Share of defects first found in production | Effectiveness of pre-release testing | Production defects go unreported |
| **Escapes by layer** | Which test layer should have caught each escape | Where to invest | Root-cause analysis is skipped |
| **MTTD / MTTR** | Detection and restore times | Operational quality | Averages hide the long tail; definitions differ |
| **DORA four keys** | Deployment frequency, lead time, change failure rate, time to restore | Delivery performance | Compared across teams as a league table |

### 4.3 DORA metrics

From the DevOps Research and Assessment programme (*Accelerate*, and the yearly State of DevOps reports):

- **Deployment frequency:** how often you deploy to production.
- **Lead time for changes:** commit to running in production.
- **Change failure rate:** share of deployments causing a failure in production.
- **Time to restore service:** how long to recover from a failure.

DORA's research found that high performers are fast *and* stable: the two improve together with good engineering practices. The metrics are for a team to understand and improve itself, not for comparing teams.

### 4.4 Definitions are design decisions

The same data gives different numbers under different, reasonable definitions. In this lab's sample month:

| Metric | Definition A | Definition B |
|---|---|---|
| MTTD | Mean: **34.8 min** | Median: **4.5 min** |
| MTTR | From detection: **46.8 min** | From incident start: **81.7 min** |

Neither column is "right": they answer different questions. A metric without its definition is not information. And a mean dominated by one outlier (customer-reported incidents took 97.5 minutes to detect, automated ones 3–4) hides the real story: how incidents are detected matters more than the average.

### 4.5 Goodhart's law and healthy metrics

*"When a measure becomes a target, it ceases to be a good measure."* Test counts invite trivial tests; coverage targets invite assertion-free tests; "bugs found" invites bug splitting and late testing; low flaky rates invite deleting tests rather than fixing them.

Healthier practice:

- Measure **outcomes** (escapes, incidents, lead time) alongside **activities** (tests, coverage).
- Use **pairs of metrics** that balance each other: speed *and* stability, coverage *and* mutation score.
- Show **trends** with context, not single numbers.
- Use metrics for **learning**, not for individual performance reviews.

### 4.6 Failure analysis

- **Triage categories:** product bug, test bug, environment or infrastructure, flaky, known issue.
- **Clustering:** group failures by a normalised signature (error type + top of stack + normalised message, with numbers, ids and timestamps removed), so 200 failures become 3 causes.
- **Escape analysis:** for every production defect, ask which layer should have caught it and why it didn't. The sample data shows one escape each from unit, API and E2E.
- **Cost of flakiness:** reruns × duration × people waiting. A small flaky rate across thousands of tests wastes a lot of engineering time.

### 4.7 Quarantine

A **quarantine** moves a known-flaky test out of the blocking path while keeping it running and visible:

- it still runs and reports, but doesn't fail the build
- it has an owner and a deadline
- it leaves quarantine when it's fixed (passing consistently for N runs), or is deleted if it isn't worth fixing
- the quarantine list itself is a metric: if it only grows, the policy is a graveyard

### 4.8 Reporting for an audience

| Audience | Wants | Example content |
|---|---|---|
| Developer, now | What broke in my change, and why | Failing tests with traces, flaky marker, owner |
| Team, weekly | Health and trends | Flaky tests and their rates, slowest tests, escapes, quarantine list |
| Leadership, monthly | Outcomes and risks | DORA trends, escape rate, incidents, major risks, investments needed |

A good report answers a question its audience has, states its definitions, and ends with a decision or an action.

## 5. Architecture: quality intelligence in this course

![Quality intelligence in this course: qi:collect stores run history, analyze.mjs parses and summarises it, qi:report shows failing, flaky and slow tests; npm run metrics turns deployment, incident and defect CSVs into MTTD, MTTR, DORA and escape metrics; both feed decisions in the notebook; the quality gate reads junit.xml, which can't see passes after retries.](../../assets/diagrams/11-architecture.svg#only-light){ loading=lazy }
![Quality intelligence in this course: qi:collect stores run history, analyze.mjs parses and summarises it, qi:report shows failing, flaky and slow tests; npm run metrics turns deployment, incident and defect CSVs into MTTD, MTTR, DORA and escape metrics; both feed decisions in the notebook; the quality gate reads junit.xml, which can't see passes after retries.](../../assets/diagrams/11-architecture-dark.svg#only-dark){ loading=lazy }

## 6. How it connects with other practices

| Practice | Connection |
|---|---|
| **Risk (Topic 1)** | Escapes and incidents feed the risk register; traceability shows which risks have tests |
| **Mutation and coverage (Topics 2–3)** | Inputs to test-strength reporting; trends per module |
| **Flaky tests (Topic 5)** | Detected and tracked here; fixed there |
| **CI/CD (Topic 6)** | Produces the data; the gate should consume flakiness and freshness, not only JUnit counts |
| **Observability (Topic 10)** | MTTD, MTTR and SLO history are quality data |
| **AI (Topic 12)** | Failure clustering, triage suggestions and summaries are common AI uses, with human review |
| **Leadership (Topic 14)** | Quality strategy is set and checked with these metrics |

## 7. Real-world examples

**1. The latest run lies (this repo).** Twelve runs of the same code: the BAD recommendations test from Topic 5 failed in 7. The first version of the report looks only at the latest run, so it says "Failing: BAD…" after one run and "none" after the next, and "Flaky tests: none detected" every time. Judged across the history, it's flaky, failing about half the time.

**2. Retries erase the evidence (this repo).** Run the suite the way this repo's CI does (`retries: 1`). In one batch of 12 runs, run 5 is green in JUnit, with `failures="0"`. Playwright's JSON report for the same run says `"flaky": 1`: the test failed, then passed on retry. The Topic 6 quality gate reads JUnit, so it can't see flakiness at all.

**3. The cost of known bugs (this repo).** The slowest tests in the report are the two `test.fail()` journeys from Topic 5, at about 5.3 s each, while most tests take under a second. A known-failing test waits for its assertion's full timeout every run. Recording a known bug as a test is still the right call, but it has a running cost, which is a reason to fix known bugs quickly.

**4. Google's flaky test infrastructure.** Google reported that around 16% of its tests showed some flakiness, and built tooling that re-runs failures automatically, marks tests flaky from their history, and reports flakiness to owners, so developers can trust a red result again.

**5. DORA and the speed–stability myth.** Before the DORA research, many organisations believed shipping faster meant breaking more. Years of survey data found the opposite: teams with frequent, small deployments also had lower change failure rates and faster recovery. Measuring both sides changed the debate.

## 8. Scaling across applications and teams

| Challenge | What works |
|---|---|
| Results scattered across pipelines | A central results store, with every result tagged with repo, commit, branch, environment and retry count |
| Every team defines metrics differently | Shared definitions (a metrics catalogue) with the formula and its caveats |
| Flaky tests pile up | Automatic detection from history, auto-quarantine with owners, a weekly flaky review |
| Dashboards nobody reads | Few, audience-specific views that end with an action |
| Leadership compares teams | Agree upfront: metrics are for teams to improve themselves, trends over league tables |
| Huge volumes of failures | Clustering by normalised signature; AI-assisted triage with human review (Topic 12) |

## 9. Security and data privacy

- **Results contain more than results.** Error messages, logs, screenshots and traces can include tokens, personal data and internal hostnames. This lab removes local file paths (which contain a username) before committing fixtures. Do the same for anything you store or share.
- **Retention:** keep detailed artefacts briefly, summary data longer.
- **Access:** results stores show where systems are weak, which is useful to attackers; restrict them like other internal data.
- **People data:** metrics about individuals (tests written, bugs found per person) raise privacy and labour-law questions in many countries, and damage trust anyway. Measure teams and systems, not people.

## 10. Performance, maintenance, and cost

| Concern | Guidance |
|---|---|
| **Storage** | One row per test per run grows quickly; aggregate old data, keep raw data for a window |
| **Analysis cost** | Simple per-test aggregates are cheap; clustering and ML need budget and tuning |
| **Run count** | Rare flakes need many runs to show; repeated runs cost CI time, so use CI's natural history first |
| **Maintenance** | Stable test ids matter: renaming a test breaks its history (consider ids or annotations) |
| **Report upkeep** | Every dashboard needs an owner and a question; retire the rest |

## 11. Common problems and failure scenarios

| Problem | Symptom | Fix |
|---|---|---|
| **Only the latest run is analysed** | Flaky tests look random; no trends | Keep and analyse history |
| **Retries hide flakiness** | Green dashboards, slow trust erosion | Store retry information (runner-native formats); report retried passes |
| **Flaky and failing conflated** | Real regressions dismissed as "just flaky", or flakes chased as bugs | Classify by history: always failing vs sometimes failing |
| **Undefined metrics** | Arguments about numbers | Publish definitions; show the formula next to the number |
| **Means of skewed data** | "MTTD 35 min" while most incidents are found in 4 | Medians and breakdowns by cause |
| **Vanity metrics** | Test count up, escapes up too | Outcome metrics; balanced pairs |
| **Metrics as targets for individuals** | Gaming, fear, hidden problems | Team-level learning metrics |
| **Renamed tests lose history** | Flaky test "fixed" by renaming it | Stable ids; history tooling that follows renames |
| **Quarantine as a graveyard** | The quarantine list only grows | Deadlines, owners, a limit |

## 12. Important trade-offs

- **Detail vs effort.** Rich data (every attempt, every artefact) enables deep analysis and costs storage and tooling; summaries are cheap and lose information.
- **Standard vs rich formats.** JUnit works everywhere and hides retries; runner-native formats keep everything and tie you to a tool. Keep both, as the lab's collector does.
- **Fixing vs quarantining flaky tests.** Quarantine restores trust in the build quickly, and risks losing the test's protection while it's out.
- **Many metrics vs focus.** More metrics show more angles and dilute attention. A handful, well defined, beats a wall of charts.
- **Automation vs judgement in triage.** Automated classification scales; humans catch the novel failure that matters.

## 13. Comparisons

### Test reporting and analytics tools

| Tool | What it does | Notes |
|---|---|---|
| **Playwright HTML report / Trace Viewer** | Per-run detail, retries, traces | Not a history store |
| **Allure Report / Allure TestOps** | Rich reports, history, flaky detection, test management | Adapters for many runners |
| **ReportPortal** | Open-source results store with ML-assisted failure triage | Self-hosted |
| **Datadog CI Visibility, BuildPulse, Trunk Flaky Tests** | Flaky detection and CI analytics as a service | Commercial |
| **CI built-ins (GitHub, GitLab, Jenkins test reports)** | JUnit-based summaries per run | Limited history and flakiness insight |
| **This lab's `analyze.mjs`** | A few hundred lines that show the ideas | For learning, not production |

### Test management tools

| Tool | Focus |
|---|---|
| TestRail, Zephyr, Xray | Test cases, plans and runs, traceability to requirements (Jira) |
| Qase, Testmo | Modern test management with automation results import |
| Spreadsheets and Markdown in the repo | Lightweight, reviewable, versioned: enough for many teams (like this course's notebook) |

### Delivery metrics tools

| Tool | Notes |
|---|---|
| DORA's Four Keys (open source), Sleuth, LinearB, Faros, Swarmia | Compute DORA metrics from Git, CI and incident data |
| This lab's `quality_metrics.py` | Each metric is one readable function, so you can question it |
