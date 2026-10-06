# Topic 13 · Concepts

## 1. What is it?

**QA platform engineering** builds the shared tools, infrastructure and standards that let many teams test well **without each team building it all again**. It applies platform engineering, the practice of building an internal platform that product teams use self-service, to quality.

The vocabulary:

- **Internal developer platform (IDP):** the self-service tools, infrastructure and documentation a company provides to its product teams.
- **Paved road / golden path:** the supported, easiest way to do something (build a service, test it, deploy it) that also happens to be the right way. Teams may leave it, but staying on it is cheaper.
- **Test infrastructure:** what tests run on: CI runners, browser grids and device clouds, ephemeral environments, test data services, results stores.
- **Standards and conformance:** rules every service should meet (health checks, request ids, JSON errors, security headers), checked automatically by a **conformance suite**, sometimes called **fitness functions** in evolutionary architecture.
- **Scaffolding / templates:** tools that create a new service already on the paved road (Backstage Software Templates, cookiecutter, `npm init` templates, this lab's `platform:new`).

## 2. Why do we need it?

Everything in Topics 1–12 was built for one shop. Now imagine fifty services, owned by fifteen teams:

- **Duplication:** every team writes its own CI pipeline, test helpers, fakes, data setup and reporting, each slightly different and slightly broken.
- **Inconsistency:** the lab's first fleet report shows two services that each meet only one or two of five basic standards, in *different* ways. Every new service repeats old mistakes.
- **Invisible risk:** nobody can say how many services lack timeouts, leak stack traces or have no contract tests.
- **Cognitive load:** product teams should spend their time on their product, not on reinventing test infrastructure.
- **A QA team can't scale by headcount.** One QA engineer per team doesn't scale either. Building the platform that makes good testing the default does.

## 3. How does it work internally?

### The platform loop

![The platform loop: standards become a conformance kit and a paved road of libraries, templates and reusable CI; services built on the paved road conform by default; the fleet report checks every service against every standard, legacy ones included, prioritises adoption work by risk, and feeds back which standards hurt.](../../assets/diagrams/13-platform-loop.svg#only-light){ loading=lazy }
![The platform loop: standards become a conformance kit and a paved road of libraries, templates and reusable CI; services built on the paved road conform by default; the fleet report checks every service against every standard, legacy ones included, prioritises adoption work by risk, and feeds back which standards hurt.](../../assets/diagrams/13-platform-loop-dark.svg#only-dark){ loading=lazy }

1. **Agree standards** with the teams who'll live with them, and write them down as checks (`platform/conformance.mjs`).
2. **Build the paved road** so meeting the standards is the easiest path: a baseline library that implements them once (`platform/express-baseline.mjs`), a template that uses it, and reusable CI that runs the checks.
3. **Measure the fleet:** run the conformance kit against every service, in one table.
4. **Drive adoption:** new services start conforming; existing services migrate, most risky first.
5. **Listen:** standards that every team works around are wrong standards.

### Fix once, in one place

| Without a platform | With a paved road |
|---|---|
| Each service writes its own request-id, header and error middleware | `useBaseline(app)` and `useErrorHandling(app)`, maintained by the platform team |
| A security fix is applied service by service, if at all | Fixed in the library; every service gets it on the next update |
| CI pipelines copied and edited per repository | One reusable workflow (`workflow_call`); each service passes its path |
| "Does every service do X?" needs an audit | The fleet report answers it in seconds |

### Reusable CI

GitHub Actions **reusable workflows** (`on: workflow_call`) let one workflow be called from many: the platform maintains the steps (pinned actions, caching, Node version, test command), and each service's workflow is a few lines that call it with inputs. GitLab includes, Jenkins shared libraries and CircleCI orbs do the same job. Improving the reusable workflow improves every service at once, which is also why changes to it need careful testing and versioning.

## 4. Main components and concepts

### 4.1 What a QA platform provides

| Capability | Examples | Topic it scales |
|---|---|---|
| Test runners and grids | Shared CI runners, Playwright on a browser grid, device clouds | 5, 6 |
| Reusable pipelines | Reusable workflows with test stages, gates and reports | 6 |
| Environments | Ephemeral environments per pull request, preview URLs | 7 |
| Test data services | Generators, masking pipelines, test-data APIs | 7 |
| Service virtualisation | Shared fakes and stubs, kept honest by contracts | 3, 4 |
| Contract infrastructure | A Pact Broker, `can-i-deploy` gates | 4 |
| Performance tooling | Load-test runners, shared k6 libraries | 8 |
| Security scanning | SCA, SAST and secret scanning built into templates | 9 |
| Observability defaults | Logging, metrics, tracing and health checks in the baseline | 10 |
| Results store and analytics | Flaky detection, trends, dashboards | 11 |
| AI tooling | Approved assistants, eval frameworks, agent sandboxes | 12 |

### 4.2 Standards as code

A standard nobody checks is a suggestion. Turn each standard into an automated check:

- **Conformance suites** run against a service (this lab's kit: health, request ids, security headers, JSON 404s, JSON client errors).
- **Fitness functions** check architectural properties continuously: response-time budgets, dependency rules, bundle sizes.
- **Policy as code** (OPA, Conftest, Kyverno) checks infrastructure and deployment manifests.
- **Linters** check code-level rules.

Good standards are **few**, **justified** (each prevents a real problem), **automated**, and **versioned**, so teams know what changed.

### 4.3 The paved road, not a mandate

Successful platforms make the right thing the easy thing:

- **Templates and scaffolding** create new services already conforming.
- **Libraries** implement cross-cutting concerns once.
- **Documentation and examples** show how, with copy-pasteable snippets.
- **Escape hatches** let teams leave the road when they must, and say why.

Mandates without a road ("every service must have X by Q3") produce checkbox compliance and resentment. A road without measurement produces drift. You need both: the road, and the fleet report.

### 4.4 Platform as a product

The platform's users are developers. Treat it like a product:

- **Discover needs:** what slows teams down?
- **Measure adoption and satisfaction:** services on the paved road, time to first green pipeline for a new service, developer surveys (DevEx).
- **Version and communicate changes:** breaking changes to a baseline library or reusable workflow are breaking changes for every team.
- **Support:** docs, office hours, a channel, fast fixes.

### 4.5 Team structures

*Team Topologies* (Skelton and Pais) names four team types that fit quality at scale:

| Team type | Quality role |
|---|---|
| **Stream-aligned** (product teams) | Own their product's quality and tests, using the platform |
| **Platform** | Build and run the test infrastructure and paved road |
| **Enabling** (for example a QA coaching or quality engineering team) | Help teams adopt practices, then step back |
| **Complicated subsystem** | Specialist areas (performance labs, security research) |

Many organisations add **communities of practice**: a quality guild or QA chapter that shares practices across teams.

### 4.6 Internal tools are software too

The platform's code (scaffolders, libraries, reusable workflows, conformance kits) runs with broad permissions across many repositories. A bug in it multiplies. In this lab, the scaffolder writes wherever a name points, so `../escape` writes outside `services/` and an existing service's name silently mixes the template into it. Platform code needs tests, review, versioning and the same security care as product code.

### 4.7 Developer experience (DevEx) metrics

Measure what the platform changes for developers:

- **Time to first green pipeline** for a new service.
- **Pipeline duration** and **flaky rate** (Topics 6, 11).
- **Adoption:** services on the current baseline version; services passing every standard.
- **Developer satisfaction:** surveys about tools and friction (the SPACE and DevEx frameworks).
- **Cognitive load** reported by teams.

## 5. Architecture: a small QA platform for Quality Books

![A small QA platform for Quality Books: platform/ holds the conformance checks, the Express baseline, a service template, a scaffolder and a reusable workflow; the scaffolder creates a new service and its workflow from them; the inventory service adopts the baseline, the shop is legacy with its own middleware; fleet.mjs runs the conformance checks against every service.](../../assets/diagrams/13-architecture.svg#only-light){ loading=lazy }
![A small QA platform for Quality Books: platform/ holds the conformance checks, the Express baseline, a service template, a scaffolder and a reusable workflow; the scaffolder creates a new service and its workflow from them; the inventory service adopts the baseline, the shop is legacy with its own middleware; fleet.mjs runs the conformance checks against every service.](../../assets/diagrams/13-architecture-dark.svg#only-dark){ loading=lazy }

## 6. How it connects with other practices

| Practice | Connection |
|---|---|
| **CI/CD (Topic 6)** | Reusable pipelines and gates are platform products |
| **Environments and data (Topic 7)** | Ephemeral environments and test-data services are platform capabilities |
| **Security (Topic 9)** | Secure defaults (headers, auth, scanning) belong in the baseline |
| **Observability (Topic 10)** | Health checks, request ids and metrics belong in the baseline |
| **Quality intelligence (Topic 11)** | The fleet report and results store are the platform's dashboards |
| **AI (Topic 12)** | Platforms provide approved AI tools, eval frameworks and agent sandboxes |
| **Strategy (Topic 14)** | Standards and platform investment are strategic decisions |

## 7. Real-world examples

**1. Zero of two (this repo).** The first fleet report: the shop fails 3 of 5 standards, the inventory service 4. Each fails in its own way. Malformed JSON gets a 500 from the shop, and an HTML error page from the inventory service. In Express's default (development) mode, that page includes a full stack trace. Each team (in this story) wrote its own, slightly different, middleware. One baseline library and one call per service fixes it everywhere it's adopted.

**2. The scaffolder that wrote anywhere (this repo).** `platform:new` joins the given name to `services/` without checking it. `../escape` writes outside the folder; the name of an existing service mixes template files into it. Run by a developer with full access to the repository, an internal tool's bug is a real risk. A one-line validation rule, and a test, fixes it.

**3. Spotify and Backstage.** Spotify built Backstage to bring its services, documentation and templates together behind one portal, with **golden paths** that create new components already set up the recommended way. They open-sourced it in 2020, and it became a widely adopted CNCF project for internal developer portals.

**4. Netflix's paved road.** Netflix has described a "paved road" culture: centrally supported tools and libraries that teams are free to leave, but rarely want to, because the paved road is the easiest way to get resilience, observability and deployment right.

**5. Google's testing infrastructure.** Google invested early in shared test infrastructure: a build system with dependency-based test selection, a central test platform (TAP), and flaky-test tooling. It also had an *engineering productivity* function whose job was to make testing easy for product engineers, not to test for them.

## 8. Scaling across applications and teams

This topic *is* about scaling, so this section is about scaling the platform itself:

| Challenge | What works |
|---|---|
| Low adoption | Make the road genuinely easier; migrate a few willing teams first and show the results |
| Breaking changes ripple to every service | Semantic versioning of libraries and reusable workflows; deprecation periods; automated upgrade PRs |
| One-size-fits-all standards | Tiers (critical vs internal services); documented exceptions with owners and expiry dates |
| The platform team becomes a bottleneck | Self-service everything; contributions from product teams (inner source) |
| Unknown fleet state | Fleet reports and scorecards per service (Backstage scorecards, custom dashboards) |
| Too many tools | A curated, supported set; deprecate the rest deliberately |

## 9. Security and data privacy

- **Platform code runs everywhere.** A compromised reusable workflow or baseline library affects every service: protect them with code review, branch protection, pinned dependencies and signed releases.
- **Secure by default:** the baseline sets security headers and hides error details; templates include dependency scanning; reusable workflows use least-privilege `permissions:`.
- **Validate tool inputs:** scaffolders, scripts and bots must refuse dangerous inputs (path traversal, shell injection).
- **Shared test infrastructure holds shared data:** browser grids, results stores and test-data services need access control and retention policies (Topics 7, 11).
- **Secrets:** the platform provides secret management; templates never contain real secrets.

## 10. Performance, maintenance, and cost

| Concern | Guidance |
|---|---|
| **Platform team cost** | Pays off when it saves more product-team time than it costs; measure that |
| **Shared runners and grids** | Cheaper per test at scale; need capacity planning and fair scheduling |
| **Maintenance** | Every template and library is a product to maintain; prefer fewer, better-supported ones |
| **Upgrade cost for teams** | Automate upgrades (Renovate or Dependabot for internal packages); keep breaking changes rare |
| **Conformance runtime** | Keep checks fast (this kit runs in well under a second per service) so they run on every change |

## 11. Common problems and failure scenarios

| Problem | Symptom | Fix |
|---|---|---|
| **Platform as mandate** | Checkbox compliance, workarounds | Build the easy path first; measure; listen |
| **Copy-paste templates** | Services diverge from day two | Libraries for behaviour, templates only for structure |
| **Untested platform code** | One bug, fifty broken services | Test the kit, the library and the tools (this lab does) |
| **No fleet visibility** | "Do all services do X?" takes weeks | Conformance reports across the fleet |
| **Breaking changes without notice** | Teams pinned to old versions forever | Versioning, changelogs, automated upgrades |
| **Too many standards** | Nobody can meet them all | Few, justified, tiered standards |
| **Platform team as gatekeeper** | Tickets to get anything done | Self-service and inner source |

## 12. Important trade-offs

- **Standardisation vs autonomy.** Standards give consistency and fleet-wide fixes; autonomy gives teams speed and fit. Standardise what's cross-cutting (health, errors, security, telemetry); leave product logic free.
- **Library vs template.** Libraries keep behaviour updatable; templates are flexible but drift. Put behaviour in libraries.
- **Central vs embedded QA.** A platform team scales practices; embedded quality engineers bring context. Most mature organisations have both.
- **Build vs buy.** Commercial platforms (and open-source ones like Backstage) save building, but need integration and fit.
- **Strict vs advisory conformance.** Blocking non-conforming services enforces standards and can stall teams; reporting first, then blocking new violations, is a common path.

## 13. Comparisons

### Platform building blocks

| Need | Options |
|---|---|
| Developer portal and templates | Backstage (Software Templates, scorecards), Port, Cortex, OpsLevel |
| Scaffolding | Backstage templates, cookiecutter, Yeoman, `create-*` packages, a script like `platform:new` |
| Reusable CI | GitHub reusable workflows and composite actions, GitLab CI includes and components, Jenkins shared libraries, CircleCI orbs |
| Policy and conformance | Conformance suites, OPA/Conftest, Kyverno, fitness functions |
| Browser and device infrastructure | Self-hosted Playwright/Selenium Grid, BrowserStack, Sauce Labs |
| Environments | Kubernetes namespaces per PR, Vercel/Netlify previews, Okteto, Signadot |

### Ways to share quality practices

| Approach | Strength | Weakness |
|---|---|---|
| Documentation and guidelines | Cheap | Easy to ignore; no feedback |
| Templates (copy once) | Fast start | Drift after creation |
| Libraries (shared code) | Fixes reach everyone | Versioning and upgrades |
| Reusable pipelines | Consistent CI | Central changes affect all |
| Conformance checks | Visibility | Need the road to be useful |
| Enabling team / coaching | Changes habits | Doesn't scale alone |
