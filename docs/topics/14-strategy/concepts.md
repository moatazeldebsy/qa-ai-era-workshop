# Topic 14 · Concepts

## 1. What is it?

A **quality strategy** is a small set of decisions about how a product or an organisation will achieve the quality its users need: which risks matter most, what evidence will show they're under control, where testing effort and money go, who owns what, and how progress is reviewed. **Engineering leadership** in quality is the work of making that strategy real: through people, culture, priorities and communication, not only through tests.

Some terms that are often confused:

| Term | Scope | Answers | Lifetime |
|---|---|---|---|
| **Quality strategy** | Organisation or product | What quality means here, which risks matter, where we invest, who owns it | Reviewed every 6–12 months |
| **Test strategy** | Product or system | How we test: levels, techniques, environments, data, automation, gates | Evolves with the system |
| **Test plan** | A release, feature or project | What exactly we'll test, when, by whom, with what exit criteria | Short-lived |
| **Quality policy** | Organisation | Principles and non-negotiables (for example "no release without passing security checks") | Long-lived |

A good strategy is short enough to read, specific enough to say no to things, and grounded in evidence.

## 2. Why do we need it?

Without a strategy, quality work drifts towards whatever is easiest to count or loudest in the room:

- **Effort goes where it's visible, not where the risk is.** Hundreds of UI tests for stable pages; nothing for the payment edge case that costs real money.
- **Coverage claims outrun reality.** This course's own risk register said a performance risk was covered by a check that couldn't detect it, and said overselling stock was covered while Topic 2 found it happening.
- **Teams optimise locally.** Each team's tests are fine; nobody owns the gaps between them (Topics 4 and 13).
- **Leaders can't decide.** "Should we invest in a platform team, or more E2E coverage, or observability?" needs evidence and a frame.
- **Quality stays someone else's job.** Without leadership, "QA" becomes a phase and a gate at the end (Topic 1), with all the costs that brings.

## 3. How does it work internally?

### The strategy loop

![The strategy loop: context leads to quality goals, then risks, an approach, investments and evidence; a quarterly review adjusts the goals, and escapes and incidents update the risks.](../../assets/diagrams/14-strategy-loop.svg#only-light){ loading=lazy }
![The strategy loop: context leads to quality goals, then risks, an approach, investments and evidence; a quarterly review adjusts the goals, and escapes and incidents update the risks.](../../assets/diagrams/14-strategy-loop-dark.svg#only-dark){ loading=lazy }

1. **Understand the context:** who the users are, what failure costs them and the business, what constraints exist (team size, regulation, legacy).
2. **Set quality goals** for the attributes that matter most (ISO 25010, Topic 1), each with a measure.
3. **Rank the risks** and make the ranking explicit.
4. **Choose the approach:** what's tested at which level, how releases are decided, what happens in production.
5. **Decide investments:** the few changes that reduce the most risk per unit of effort.
6. **Collect evidence** continuously (this topic's scorecard).
7. **Review and adjust** on a cadence, and after significant incidents.

### Evidence, not opinion

The scorecard in this topic's lab gathers what the repository can show: the test portfolio's shape, risk traceability and whether the evidence fits each risk, conformance across services, the release gate's thresholds, and production dependency risk. Opinions ("we have good coverage") become claims you can check.

### The cost of quality

A classic frame (Juran, Crosby, Feigenbaum) splits the cost of quality into four parts:

| Category | Examples | Typical lever |
|---|---|---|
| **Prevention** | Training, design reviews, testable architecture, platforms | Invest early; cheapest per defect avoided |
| **Appraisal** | Testing, reviews, audits, monitoring | Make it fast and targeted |
| **Internal failure** | Bugs found before release: rework, broken builds, flaky reruns | Reduce with prevention and fast feedback |
| **External failure** | Incidents, refunds, support, lost customers, fines | The most expensive; the one the strategy exists to avoid |

Strategy shifts money from failure towards prevention, and makes appraisal cheaper per unit of confidence.

## 4. Main components and concepts

### 4.1 What a quality strategy contains

1. **Context and scope:** the product, its users, what's in and out.
2. **Quality goals:** the few attributes that matter most, with measures (for example "99% of checkouts under 1 s", "no critical accessibility barrier in the purchase journey").
3. **Risks:** the top risks, ranked, with their current evidence.
4. **Approach:** test levels and their purpose, techniques, environments and data, non-functional testing, AI features, production monitoring.
5. **Release and quality gates:** what evidence a release needs.
6. **Roles and ownership:** who does what, including platform and enabling teams.
7. **Investments and roadmap:** what changes, in what order, why.
8. **Measures and review:** how success is judged, how often the strategy is revisited.

### 4.2 Strategy frameworks you can borrow from

| Framework | Use it for |
|---|---|
| **Risk-based testing** (Topic 1) | Ranking where effort goes |
| **Heuristic Test Strategy Model** (James Bach) | Thinking broadly: project environment, product elements, quality criteria, techniques |
| **Agile Testing Quadrants** (Marick; Crispin and Gregory) | Balancing business-facing and technology-facing, supporting and critiquing tests |
| **Test pyramid / trophy / honeycomb** (Topic 1) | The shape of the automated portfolio |
| **SLOs and error budgets** (Topic 10) | Agreeing "reliable enough" with product owners |
| **DORA** (Topic 11) | Delivery performance as a quality outcome |

### 4.3 Investment decisions

Leaders choose between good options. Make the choice explicit:

| Option | Reduces which risks | Cost | Evidence it's needed | How we'll know it worked |
|---|---|---|---|---|
| (one row per candidate investment) | | | | |

Prefer investments that remove whole classes of problems (a platform baseline, Topic 13) over ones that catch instances (one more E2E test). Prefer prevention over detection where both are possible. And state what you'll *stop* doing: every strategy is also a list of things not to do.

### 4.4 The evolving QA role

The role has moved from *executing tests* to *enabling quality*:

| From | To |
|---|---|
| A phase at the end | Quality across the whole lifecycle: shift left (requirements, design) and right (production) |
| Testers find bugs | Teams prevent them; quality engineers design the system that finds the rest |
| Manual regression | Automation at the right level, plus exploratory testing where judgement matters |
| Gatekeeper | Coach, platform builder, risk analyst |
| "Bugs found" as output | Confidence, speed and fewer escapes as outcomes |
| Testing what's built | Shaping what's built: testability, observability, acceptance examples |

AI accelerates this shift: when code and tests are cheap to generate, the scarce skills are judgement, risk analysis, oracles, and knowing what's missing (Topic 12).

### 4.5 Skills and career paths

Useful skills for quality engineers now combine:

- **Testing craft:** test design, exploratory testing, oracles, risk analysis (Topics 1–2).
- **Engineering:** code, automation at every level, CI/CD, infrastructure (Topics 3–8).
- **Systems thinking:** architecture, distributed systems, production (Topics 4, 10, 13).
- **Specialisms:** performance, security, accessibility, AI evaluation (Topics 8, 9, 12).
- **Data literacy:** metrics, statistics, avoiding misleading numbers (Topic 11).
- **Influence:** communication, facilitation, coaching, writing.

Organisations organise these differently: embedded quality engineers in teams, SDETs, enabling QA teams, platform teams, or developers who own testing with coaching support. Microsoft's 2014 move to "combined engineering" (merging separate test and development roles) is a well-known example of a shift towards whole-team ownership.

### 4.6 Culture: the part strategy documents can't write

- **Whole-team ownership:** quality is everyone's job; QA makes it easier, not optional.
- **Psychological safety:** people report problems, flaky tests and near-misses without fear. Google's Project Aristotle found it was the strongest predictor of team effectiveness.
- **Generative culture:** Ron Westrum's typology (pathological, bureaucratic, generative) predicts how information flows. DORA found generative cultures correlate with better delivery and organisational performance.
- **Blameless learning:** incidents and escaped defects become system improvements, not blame (Topic 10).
- **Stop the line:** like Toyota's andon cord, anyone can stop a release for a quality concern, and is thanked for it.
- **Leaders model it:** what leaders ask about in reviews ("how do we know this works?") is what teams optimise for.

### 4.7 Communicating quality to leadership

- **Lead with outcomes and risks in business terms:** "customers can be charged shipping they shouldn't pay", not "3 tests failed".
- **Few numbers, with definitions and trends** (Topic 11).
- **Ask for a decision:** what you need, what it costs, what it buys.
- **Be honest about uncertainty:** what you don't know is part of the picture.
- **Keep it short:** a one-page update beats a fifty-slide deck.

### 4.8 Governance and compliance

Regulated domains (finance, health, automotive, aviation, government) add requirements: traceability from requirements to tests, documented validation, audit trails, standards such as ISO 13485, IEC 62304, DO-178C, or SOC 2 controls. Good strategy meets them with the same automation (traceable tests, gates, evidence stores) rather than parallel paperwork.

## 5. Architecture: how the course fits together as a strategy

![How the course fits together as a strategy: context and goals (Topic 1), designing the checks (2), at the right level (3 to 5), in the pipeline (6, 7), beyond function (8, 9, 12), in production (10), turned into decisions (11), at scale (13), and strategy and leadership (14), which feeds back into context.](../../assets/diagrams/14-architecture.svg#only-light){ loading=lazy }
![How the course fits together as a strategy: context and goals (Topic 1), designing the checks (2), at the right level (3 to 5), in the pipeline (6, 7), beyond function (8, 9, 12), in production (10), turned into decisions (11), at scale (13), and strategy and leadership (14), which feeds back into context.](../../assets/diagrams/14-architecture-dark.svg#only-dark){ loading=lazy }

## 6. How it connects with other practices

Strategy connects *everything*: every earlier topic supplies one kind of evidence or one lever.

| Topic | Supplies |
|---|---|
| 1 Foundations | Quality attributes, the risk register, oracles |
| 2–5 Test design and levels | The portfolio's shape and strength (mutation scores) |
| 6 CI/CD | Release gates, feedback time |
| 7 Environments and data | Feasibility and privacy constraints |
| 8–9 Non-functional | Performance, security, accessibility, compatibility evidence |
| 10 Observability | SLOs, incidents, MTTD and MTTR |
| 11 Quality intelligence | Metrics, trends, flakiness, escapes |
| 12 AI | New risks and new tools |
| 13 Platform | The main lever for scaling quality |

## 7. Real-world examples

**1. Covered on paper, failing in practice (this repo).** The Topic 1 risk register, written for this course, said every must-cover risk was traced to a real check. The Topic 14 scorecard shows two problems with that claim. R6 (pricing slows down) was traced to a check of the status code, which can't detect slowness. R4 (overselling stock) was traced to a UI test of one error message, while Topic 2 found customers could oversell through duplicate cart lines. The register's *existence* gave a false sense of coverage. A strategy has to check the *fit* of evidence, not just its presence.

**2. The gate that ignores the top risk (this repo).** The highest-scored risk in the register (R2, 16: the assistant invents prices) is checked by the LLM eval suite, yet the release gate marks that evidence as optional. A release can ship without any evidence about the riskiest part of the product. That's a strategic misalignment between the risk ranking and the release rules, and it's invisible until someone puts the two side by side.

**3. Microsoft's combined engineering (2014).** Microsoft reorganised many teams to merge separate developer and tester roles into combined engineering roles, so developers owned testing with the help of quality specialists. It's often cited as a turning point in the industry's move from separate QA phases to whole-team quality.

**4. Google's Project Aristotle.** Google studied what made its teams effective and found psychological safety mattered most: teams where people felt safe to take risks and admit mistakes performed better. For quality, it means people report flaky tests, near-misses and doubts early.

**5. Toyota's andon cord.** On Toyota production lines, any worker can pull a cord to stop the line when they see a defect, and is thanked for it. The software equivalents (anyone can block a release, any red build stops merging) only work when leadership backs them.

## 8. Scaling across applications and teams

| Level | Strategy looks like |
|---|---|
| One team, one product | A one-page test strategy in the repo, reviewed quarterly |
| A product with several teams | A shared product quality strategy; team-level test strategies; shared gates and SLOs |
| An organisation | A quality policy (non-negotiables), platform investment, communities of practice, portfolio-level risk and metrics |

Principles that scale: decide centrally what must be consistent (security, gates, standards), decentralise how teams meet it, make the paved road easy (Topic 13), and review with evidence rather than status reports.

## 9. Security and data privacy

Strategy is where security and privacy become explicit priorities rather than afterthoughts:

- **Non-negotiables in the quality policy:** no known high-severity production vulnerabilities, no personal data in test environments, security checks in every pipeline.
- **Ownership:** who decides on accepted risks and exceptions, with an expiry date.
- **Regulation as a constraint:** GDPR, the EU AI Act, accessibility law and sector rules shape the approach.
- **Evidence for auditors** comes from the same pipelines as everything else.

## 10. Performance, maintenance, and cost

| Concern | Guidance |
|---|---|
| **Strategy upkeep** | Short documents, reviewed on a cadence, are maintained; long ones are not |
| **Cost of evidence** | Automate evidence collection (scorecards, dashboards) so reviews take an hour, not a week |
| **Cost of change** | Sequence investments; finish one before starting the next |
| **Return on investment** | Track the outcome measures you named when you asked for the investment |

## 11. Common problems and failure scenarios

| Problem | Symptom | Fix |
|---|---|---|
| **The shelf document** | A long strategy nobody reads | One or two pages, in the repo, reviewed quarterly |
| **Strategy without evidence** | Opinions and anecdotes drive priorities | A scorecard; metrics with definitions |
| **Coverage theatre** | "Covered" risks still cause incidents | Check the fit of evidence to risk, and test the tests |
| **Misaligned gates** | Top risks not required for release | Derive gate rules from the risk ranking |
| **Everything is a priority** | Nothing improves | Three investments at a time; a stop list |
| **QA as a separate tribe** | Throw-it-over-the-wall, slow feedback | Whole-team ownership; QA as coaches and platform builders |
| **Metrics as performance targets** | Gaming (Topic 11) | Learning metrics; team-level outcomes |
| **No review** | The strategy describes last year | A cadence, and a review after big incidents |

## 12. Important trade-offs

- **Speed vs certainty.** More evidence before release means slower releases; less means more escapes. SLOs, error budgets and progressive delivery let you trade explicitly.
- **Central vs team decisions.** Central decisions give consistency; team decisions give fit and ownership.
- **Prevention vs detection.** Prevention is cheaper per defect but harder to show; detection produces visible numbers.
- **Specialists vs generalists.** Specialists go deep (performance, security, AI); generalists spread practices. Most organisations need both.
- **Build vs buy** for tooling and platforms (Topic 13).
- **Ambition vs capacity.** A strategy that asks for everything delivers nothing.

## 13. Comparisons

### Ways to organise quality

| Model | Strengths | Risks |
|---|---|---|
| **Separate QA team / phase** | Clear ownership, independent view | Late feedback, bottleneck, "throw it over the wall" |
| **Embedded quality engineers** | Context, fast feedback | Inconsistent practices across teams |
| **Whole-team ownership with coaching** | Developers own tests; QA coaches | Needs strong engineering culture |
| **Platform plus enabling team** | Scales practices and infrastructure | Needs product thinking in the platform team |
| **Specialist centres** (performance, security, a11y, AI) | Depth | Can become bottlenecks |

### Ways to communicate quality

| Format | Best for |
|---|---|
| A one-page update with a decision | Leadership |
| A scorecard per product or service | Comparing over time, not ranking teams |
| SLO and incident reviews | Operations and product |
| Risk register reviews | Prioritisation |
| Dashboards | Self-service, if each has a question and an owner |
