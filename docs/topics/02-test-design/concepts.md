# Topic 2 · Concepts

## 1. What is it?

A **test design technique** is a systematic method for deriving tests from some source of information. That source is called the **test basis**: a requirement, a contract, a model, the code, or experience.

Every technique answers two questions:

1. **Which inputs and situations should I test?** (selection)
2. **When have I tested enough?** (a **coverage criterion**: a measurable rule such as "every partition once" or "every transition once")

Two terms you'll meet constantly:

- A **test condition** is *something worth testing*: "quantity above the maximum".
- A **test case** is *a concrete way to test it*: "add 11 copies of book 1; expect a 400 error *quantity must be an integer from 1 to 10*".

Techniques come in four families:

| Family | Derives tests from | Examples |
|---|---|---|
| **Black-box (specification-based)** | What the system should do, without looking at the code | Equivalence partitioning, boundary values, decision tables, state transitions, pairwise, use cases |
| **White-box (structure-based)** | The code's structure | Statement, branch, condition and MC/DC coverage |
| **Experience-based** | The tester's knowledge of how software fails | Error guessing, checklists, exploratory heuristics |
| **Generative** | Rules that must hold for many inputs | Property-based, metamorphic, model-based testing |

## 2. Why do we need it?

Because **exhaustive testing is impossible** (Topic 1, principle 2), and choosing tests by gut feeling has predictable gaps:

- People test the **happy path** and the error they've seen before, and miss the combinations.
- Different testers write very different suites for the same feature. That makes coverage a matter of luck.
- Without a coverage criterion, nobody can say **when** testing is done or **what** was left out.
- Without a technique, you can't **explain** your test selection to a reviewer, an auditor or your future self.

The numbers in this repo make the point. The cart alone accepts around 19,000 valid single-line-per-book carts, plus infinitely many invalid ones. The order lifecycle has 30 state/event pairs. The shop's configuration matrix has 108 combinations. Techniques reduce each of these to a few dozen tests, and they tell you exactly what you gave up in the process.

## 3. How does it work internally?

Every technique follows the same pipeline. Only the **model** in the middle changes:

```mermaid
flowchart LR
  B["Test basis<br/>requirement, contract,<br/>code, experience"] --> M["Model<br/>partitions, table, state machine,<br/>parameter list, property"]
  M --> C["Test conditions<br/>what to cover"]
  C --> T["Test cases<br/>concrete inputs +<br/>expected results (oracle)"]
  T --> X["Run & measure<br/>coverage of the model"]
  X -->|gaps, surprises| M
```

1. **Read the basis** and pick a technique whose model fits its shape:
    - ranges of values → partitions and boundaries
    - combinations of conditions → decision table
    - behaviour that depends on history → state machine
    - many independent settings → pairwise
    - a rule for all inputs → property
2. **Build the model.** This step alone finds bugs, because building it forces questions the requirement never answered. ("What happens on day 30 exactly?" "Can a shipped order be cancelled?")
3. **Derive test conditions** from the model using a coverage criterion.
4. **Write test cases**: concrete inputs plus an **oracle** (Topic 1) that says what the right answer is.
5. **Run them and measure** how much of the *model* you covered. That's a different number from code coverage.
6. **Feed back.** Surprises update the model and often the requirement.

The lab's mutation scorecard adds a final step: **evaluate the design** by planting bugs and checking which techniques notice them.

## 4. Main components and concepts

### 4.1 Equivalence partitioning (EP)

**Idea:** split each input's possible values into **partitions** (also called *equivalence classes*). A partition is a group of values the system should handle the same way. If one value from a partition works, the others probably do too, so test **one value per partition**.

The cart's `quantity` field:

| Partition | Values | Expected | Test value |
|---|---|---|---|
| Below range | …, -1, 0 | Rejected | 0 |
| Valid | 1 … 10 | Accepted (if in stock) | 5 |
| Above range | 11, 12, … | Rejected | 11 |
| Not an integer | 1.5, `"2"`, `null` | Rejected | 1.5, `"2"`, `null` |

Rules that make EP work:

- **Invalid partitions get one test each.** If you combine two invalid values in one test, the first error hides the second (*error masking*).
- **Partitions come from the spec, then get refined by the code.** If the code treats 1–3 differently from 4–10 (say, a bulk discount), that's a partition boundary, even if the spec never mentions it.
- **Output partitions count too.** "Shipping charged" and "shipping free" are output partitions. You need inputs that land in each.

### 4.2 Boundary value analysis (BVA)

**Idea:** bugs cluster at the **edges** of partitions, because that's where programmers write `<` instead of `<=`, or count from 0 instead of 1. So test the values on and next to each boundary.

- **Two-value BVA:** the boundary and its closest neighbour in the next partition: 10 and 11.
- **Three-value BVA:** the boundary and the values either side of it: 9, 10 and 11. It's stronger: it catches a `==` that should be `<=`.

The boundaries in Quality Books:

| Rule | Boundary | Tests |
|---|---|---|
| Quantity minimum | 1 | 0 · 1 |
| Quantity maximum | 10 | 10 · 11 |
| Stock (book 5 has 3) | 3 | 3 · 4 |
| Free shipping | 50.00 EUR | 49.99 · 50.00 · 50.01 |
| Refund window | day 30 | 30 · 31 (and 0, and −1 as invalid) |

!!! tip "The boundary is a requirement question first"
    "Within 30 days": is day 30 in or out? "Over 50 EUR": is 50.00 over? BVA forces you to ask. Topic 1's inconsistency was exactly this kind of question, left unanswered.

**Domain testing** extends BVA to several inputs that interact. Example: a rule like `quantity × price ≤ credit limit` has a *diagonal* boundary, so you test points on, just inside and just outside that line.

### 4.3 Decision tables

**Idea:** when the outcome depends on a **combination** of conditions, list every combination as a column (a **rule**) and decide the outcome for each. With *n* yes/no conditions there are 2ⁿ columns. **Collapsing** merges columns where a condition doesn't matter, marked `-`.

The refund policy as a decision table (`app/src/orders.js`):

| Conditions | R1 | R2 | R3 | R4 | R5 |
|---|:-:|:-:|:-:|:-:|:-:|
| Within 30 days? | Y | Y | Y | Y | N |
| Arrived damaged? | Y | Y | N | N | – |
| Original condition? | Y | N | Y | N | – |
| **Refund?** | **yes** | **yes** | **yes** | **no** | **no** |

Two things happen when you build a table like this:

1. **Gaps appear.** If the policy only said *"returned within 30 days in original condition"*, column R2 (damaged, *not* original condition) would have no defined answer. Someone must decide, and that decision is a requirement.
2. **Contradictions appear.** If two rules claim the same column with different outcomes, the requirement is inconsistent.

Collapsed columns are **claims**. "If late, nothing else matters" is a claim worth testing, so the lab tests all four combinations behind R5.

*Cause-effect graphing* is a formal way to derive decision tables from logical relationships (AND, OR, NOT, and constraints between causes). It's useful for complex rule sets, but rarely worth the ceremony for small ones.

### 4.4 State-transition testing

**Idea:** when behaviour depends on **history** (what happened before), model the system as a **state machine** and derive tests from it:

- **State:** a condition the system is in (`paid`).
- **Event:** something that happens (`ship`).
- **Transition:** a move from one state to another caused by an event (`paid --ship--> shipped`).
- **Guard:** a condition that must be true for the transition (`refund` only if the claim is accepted).

```mermaid
stateDiagram-v2
  [*] --> placed
  placed --> paid: pay
  placed --> cancelled: cancel
  paid --> shipped: ship
  paid --> cancelled: cancel
  shipped --> delivered: deliver
  delivered --> refunded: refund [claim accepted]
  cancelled --> [*]
  refunded --> [*]
```

Coverage criteria, from weakest to strongest:

| Criterion | Meaning | Tests for orders |
|---|---|---|
| All states | Visit every state | 3 paths |
| **All transitions (0-switch)** | Take every valid arrow once | 6 |
| **All invalid transitions** | Try every state/event pair that has no arrow | 24 |
| 1-switch (transition pairs) | Take every *sequence* of two arrows | ~8 |

The **state/event table** is the most valuable artefact here. It has one row per state and one column per event, and every cell is either a target state or "invalid". Most suites test the arrows and forget the empty cells. Yet "a shipped order can still be cancelled" is exactly the kind of bug that costs money.

### 4.5 Pairwise and combinatorial testing

**Idea:** when there are many **independent settings** (factors), testing every combination explodes multiplicatively. Most interaction bugs involve only **two** factors ("RTL text breaks on mobile"). So cover every *pair* of values at least once.

Quality Books runs on:

| Factor | Values |
|---|---|
| browser | chromium, firefox, webkit |
| viewport | mobile, tablet, desktop |
| locale | en-GB, de-DE, ar-EG (right-to-left) |
| assistant | mock, claude |
| network | fast, slow-3g |

That is 3 × 3 × 3 × 2 × 2 = **108** combinations. Covering every pair takes **11** (the theoretical minimum is 9 = 3 × 3).

Concepts you'll meet:

- **Strength (t-way):** pairwise is t = 2. Three-way covers every triple. NIST research on real failures found most involve one or two factors, almost all involve six or fewer, so strength 3–4 is used for critical systems.
- **Constraints:** some combinations are impossible ("webkit on Windows"). Tools let you exclude them.
- **Orthogonal arrays** are a mathematical way to build balanced pairwise sets. Greedy tools such as Microsoft PICT, NIST ACTS and AllPairs are the practical way.
- **Seeding:** forcing in combinations you know are important, such as your most common real-user configuration.

!!! warning "Pairwise is a selection technique, not an oracle"
    It tells you *which configurations* to run. You still need tests with good oracles to run in each one.

### 4.6 Use-case and scenario testing

**Idea:** derive tests from **user journeys**: a main success scenario plus its alternative and exception flows. For example: *"A customer searches, adds two books, sees free shipping, checks out."* Then: *"…but one book goes out of stock between adding and checkout."*

Scenarios catch integration and workflow bugs that input-level techniques miss. They're the natural basis for E2E tests (Topic 5) and BDD scenarios. **Example mapping** (Matt Wynne) is a collaborative version: in a 25-minute session, product, development and QA write rules, examples for each rule, and open questions on cards. Those examples become the tests.

### 4.7 Classification tree method

**Idea:** draw the input domain as a tree. Classifications (such as *cart size* or *book availability*) branch into classes (*1 line, 2–3 lines, many*; *in stock, low stock, out of stock*). Then pick combinations of classes as test cases. It's EP made visual and multi-dimensional, and it pairs well with pairwise for selecting the combinations.

### 4.8 White-box coverage criteria

When you *can* see the code, coverage criteria measure how much of its structure your tests exercise:

| Criterion | Requires | For `if (a \|\| b)` |
|---|---|---|
| **Statement** | Every line runs | One test that enters the `if` |
| **Branch (decision)** | Every `if` goes both ways | One true, one false |
| **Condition** | Every boolean sub-expression is both true and false | `a` and `b` each true and false |
| **MC/DC** (modified condition/decision coverage) | Each condition is shown to *independently* change the outcome | n + 1 tests for n conditions |

MC/DC is required for the most critical avionics software under DO-178C. Most product teams use branch coverage as a *floor*, never as a *target* (Topic 1: coverage measures what ran, not what was checked).

### 4.9 Experience-based techniques

- **Error guessing:** use knowledge of typical mistakes to target likely bugs: empty inputs, duplicates, zero, one, many, very large values, special characters, time zones, concurrency, and repeating an action twice. The lab's *"same book on two lines"* came from here.
- **Checklists:** codified experience, for example an API checklist (auth, pagination, idempotency, error format) or an accessibility checklist.
- **Heuristics for exploration:** the Heuristic Test Strategy Model's **SFDIPOT** (Structure, Function, Data, Interfaces, Platform, Operations, Time) gives you directions to explore in. **Zero-one-many** and **Goldilocks** (too small, too big, just right) are quick input heuristics.
- **Attacks:** James Whittaker's *How to Break Software* lists systematic attacks, such as forcing every error message or overflowing input buffers.

### 4.10 Property-based and metamorphic testing

**Property-based testing (PBT):** instead of choosing inputs, describe the *shape* of valid inputs (a **generator**, which fast-check calls an *arbitrary*) and a **property** that must hold for all of them. The tool generates many inputs (100 by default). When one fails, the tool **shrinks** it: it simplifies the failing input step by step until it finds a minimal case that still fails. It also prints a **seed** so you can replay exactly that run.

```js
fc.assert(fc.property(sellableCart, (items) => {
  const c = priceCart(items);
  assert.equal(c.total, cents(c.subtotal + c.shipping));
}));
```

Common kinds of property:

| Kind | Example |
|---|---|
| Invariant | `total = subtotal + shipping` |
| Round trip | `parse(format(x)) === x` |
| **Metamorphic** | Reordering lines doesn't change the total; adding a line never lowers the subtotal |
| Model / oracle comparison | The fast implementation agrees with a slow, obviously correct one |
| Model-based (stateful) | Random event sequences keep the order in a known state |

**Metamorphic testing** is the answer to the oracle problem. You may not know the right output for an input, but you know how the outputs of *two related inputs* must relate. It's widely used for search engines, compilers, ML models and LLM features (Topic 12).

The catch: **generators encode assumptions.** In the lab the "sellable cart" generator picks *different* books, so it can never generate the duplicate-line bug. When you drop that assumption, the bug appears within a few dozen inputs.

### 4.11 Model-based testing (MBT)

**Idea:** build an explicit, executable model of the behaviour (usually a state machine) and let a tool generate test sequences from it, sometimes also checking the real system against the model as it runs. The lab's random event sequences are a lightweight version. Heavyweight tools such as GraphWalker generate paths through large models. MBT pays off when behaviour is complex and stateful, such as protocols, workflows or devices.

### 4.12 Choosing techniques by the shape of the problem

| If the requirement looks like… | Use |
|---|---|
| "Between X and Y", "at least", "up to" | EP + BVA |
| "If A and B, unless C…" | Decision table |
| "After…", "only when…", statuses, workflows | State transition |
| "Must work on all browsers, locales, plans…" | Pairwise, plus seeded real configurations |
| A user goal with steps | Use case / scenario, example mapping |
| "Always", "never", "for any…" | Property-based / metamorphic |
| Free text, no clear structure | Exploratory, guided by heuristics |
| Safety-critical code | Add MC/DC and formal reviews |

## 5. Architecture: from requirement to a balanced suite

```mermaid
flowchart TB
  REQ["Requirement<br/>'Quantity 1-10, within stock;<br/>refunds within 30 days…'"] --> Q{"Shape of<br/>the rule?"}
  Q -->|ranges| EP["EP + BVA<br/>partitions.test.js"]
  Q -->|combinations| DT["Decision table<br/>decision-table.test.js"]
  Q -->|history| ST["State transition<br/>state-transition.test.js"]
  Q -->|for all inputs| PBT["Properties<br/>properties.test.js"]
  Q -->|configurations| PW["Pairwise matrix<br/>pairwise.mjs"]
  EXP["Experience:<br/>error guessing"] --> EP
  EP & DT & ST & PBT --> SUITE["Test suite"]
  PW -->|which environments<br/>to run it in| SUITE
  SUITE --> MUT["Mutation scorecard<br/>mutants.mjs"]
  MUT -->|survivors = blind spots| Q
```

The mutation scorecard closes the loop. It measures the suite's ability to catch bugs, and a surviving mutant tells you which technique to add.

## 6. How it connects with other practices

| Practice | Connection |
|---|---|
| **Requirements and BDD** | Building partitions and tables finds requirement gaps, so test design is also requirements review. Example mapping produces test cases directly. |
| **Unit testing (Topic 3)** | Techniques decide *what* to test; unit tests are the cheapest *where*. Most EP/BVA and decision-table tests belong at unit level. |
| **API and contract testing (Topic 4)** | A contract's schema *is* a partition definition (`minimum: 1, maximum: 10`). Schema-based fuzzers derive boundary tests from it. |
| **E2E testing (Topic 5)** | Use-case scenarios and pairwise configuration matrices drive what E2E runs and where. |
| **CI (Topic 6)** | Pairwise matrices become CI job matrices. Property tests need pinned seeds in CI for reproducibility. |
| **Performance (Topic 8)** | Load profiles are partitions of traffic: normal, peak, spike, soak. |
| **Security (Topic 9)** | Fuzzing is generative testing aimed at crashes and vulnerabilities. Boundary and invalid partitions are where injection lives. |
| **AI in QA (Topic 12)** | Metamorphic testing is the main oracle for LLM features. AI can draft partitions and tables, and humans must review the boundaries. |

## 7. Real-world examples

**1. The duplicate-line bug (this repo).** Every rule in `priceCart` is checked one line at a time: quantity 1–10, quantity within stock. Send the same book on two lines and each line passes on its own, so the shop sells 4 copies of a book it has 3 of, or 13 copies of a book capped at 10 per line. EP, BVA and the "sellable cart" property all miss it. Error guessing and a property with a less restrictive generator find it. It's a classic **combination** bug, and you'll fix it in the lab.

**2. A decision-table gap (this repo).** The assistant checks "off-topic" words before "shipping" words. So *"Will bad weather delay my delivery?"* (a genuine shop question) gets *"I can only help with questions about Quality Books"*. Nobody wrote that behaviour on purpose. It's what happens when rule *order* decides overlapping cases, and nobody drew the table.

**3. The Zune freeze (2008).** On 31 December 2008, Microsoft's 30 GB Zune players froze worldwide. The clock driver's leap-year logic looped forever on the 366th day of a leap year. That's a boundary value (the last day of a leap year) nobody tested.

**4. Ariane 5 flight 501 (1996).** A 64-bit floating-point horizontal velocity was converted to a 16-bit signed integer. On Ariane 4's flight profile the value never exceeded the range; Ariane 5 accelerated faster. It overflowed 37 seconds after launch and the rocket was destroyed. The input partition "values above 32,767" existed in the new context and was never tested, because the code was reused without re-analysing its domain.

**5. Interaction bugs in configuration.** NIST studies of real-world failures (medical devices, browsers, servers, databases) found that most were triggered by one or two interacting parameters, and nearly all by six or fewer. This evidence is why pairwise testing is used for configuration-heavy products such as browsers, SDKs and multi-tenant SaaS settings.

**6. Property-based testing in industry.** QuickCheck, the original PBT tool for Haskell, was later commercialised for Erlang. A well-known engagement modelled AUTOSAR automotive software and found many defects in components that had been tested conventionally. Teams using Hypothesis (Python) commonly report it finding bugs in date handling, unicode and serialisation that example tests had missed for years.

## 8. Scaling across applications and teams

| Challenge at scale | What works |
|---|---|
| Every team designs tests differently | A short **test design checklist** in the PR template: "boundaries tested? invalid partitions one per test? state table complete?" |
| Requirements arrive without boundaries | Make **examples part of the definition of ready**: no story enters a sprint without its boundary examples (example mapping). |
| Configuration matrices explode across products | Maintain **one shared factor model** (browsers, locales, plans) and generate pairwise CI matrices from it, seeded with the top real-user configurations from analytics. |
| Property tests are hard to adopt | Provide **shared generators** for domain types (money, carts, users) in a test library, so teams write properties instead of generators. |
| "How good are our tests?" can't be answered | Run **mutation testing** nightly on critical modules (Stryker, PIT, mutmut) and trend the mutation score per team. Don't make it a hard gate. |
| Knowledge stays in individuals' heads | Keep **decision tables and state diagrams in the repo** next to the tests (as here), so they're reviewed and versioned like code. |

## 9. Security and data privacy

- **Invalid partitions are attack surface.** Over-long strings, negative quantities, wrong types and duplicates are what attackers send. The duplicate-line bug would let someone order stock that doesn't exist, which is a business-logic vulnerability. Security testing (Topic 9) is largely EP and BVA aimed at hostile inputs.
- **State machines encode authorisation.** "Can a cancelled order be refunded?" is a security question as well as a functional one. Testing the invalid cells of the state table is how you find privilege and workflow bypasses.
- **Generated data must be synthetic.** Property tests and pairwise matrices should never pull values from production data. Generators produce realistic shapes without real people.
- **Fuzzing finds crashes, but its output can include sensitive inputs.** Store corpora carefully and don't attach them to public bug reports.
- **Seeds and counterexamples are safe to share.** That's one more reason to prefer generators to production samples.

## 10. Performance, maintenance, and cost

| Technique | Cost to design | Cost to run | Maintenance |
|---|---|---|---|
| EP/BVA | Low | Very low (unit) | Low; tables update when rules change |
| Decision table | Medium; needs requirement answers | Low | Grows 2ⁿ with conditions, so collapse aggressively |
| State transition | Medium; needs a model | Low | The model must track the code; a test comparing them (as in the lab) keeps them honest |
| Pairwise | Low with a tool | Proportional to rows × suite time | Regenerate when factors change; pin output for stable CI |
| Property-based | Higher; generators take skill | Higher (100 runs per property) | Low per property, and properties survive refactors well |
| Mutation testing | Low with a tool | **High**: one suite run per mutant | Run nightly or on changed files only |

Cost tips:

- Keep technique-driven tests at **unit level** where possible. The lab's 85 tests run in about 100 ms.
- Use **data-driven tests** (one test body, a table of rows), as in `partitions.test.js`, so a new boundary is one line.
- Pin property-test **seeds in CI** (`FC_SEED`) for reproducibility, and let local runs stay random to keep exploring.
- Run full mutation testing **incrementally**, only on changed code, as Stryker and PIT support.

## 11. Common problems and failure scenarios

| Problem | Symptom | Fix |
|---|---|---|
| **Partitions from the code, not the spec** | Tests confirm what the code does, including its bugs | Derive partitions from requirements first, then refine with code |
| **Combining invalid values** | A test passes because the first error masks the second | One invalid partition per test |
| **Only on-boundary values** | `<=` vs `<` mistakes slip through | Use values on both sides (two- or three-value BVA) |
| **Happy-path state tests only** | Workflow bypass bugs in production | Test every invalid cell of the state table |
| **Decision tables never collapsed** | 64-column tables nobody maintains | Collapse with `-`, but test the collapsed claims |
| **Pairwise treated as complete** | A three-factor bug escapes | Seed known-risky triples; raise strength for critical areas |
| **Generators too narrow** | Properties pass, bugs remain | Review generators like code: what can they *never* produce? |
| **Weak properties** | `result !== undefined` "passes" | Properties need real oracles: invariants, metamorphic relations, models |
| **Unreproducible PBT failures in CI** | "It failed once, can't reproduce" | Log and pin seeds; replay with `FC_SEED` |
| **Technique monoculture** | High scores on one kind of bug, blind to others | Mix techniques; let a mutation scorecard show the gaps |

## 12. Important trade-offs

- **Rigour vs speed.** A full decision table for a five-condition rule is 32 columns. Sometimes three examples and a conversation are enough. Let risk decide (Topic 1).
- **Two-value vs three-value BVA.** Three-value catches more mutations and costs one more test per boundary. Use it on money, time and limits.
- **Pairwise vs exhaustive.** Pairwise is about 10% of the cost for most of the interaction bugs, and blind to rare higher-order ones. Exhaustive is affordable when factors are few or tests are very fast.
- **Examples vs properties.** Examples are readable and document intent. Properties explore further, and are harder to read and write. Use both: examples for the spec, properties for the space.
- **Model fidelity vs maintenance.** A detailed state model finds more, and must change with every feature. Model what's risky, not everything.
- **Mutation testing value vs cost.** It's the best measure of test strength, and the most expensive to run. Run it selectively.

## 13. Comparisons

### Techniques side by side

| Technique | Best at finding | Blind to | Coverage criterion |
|---|---|---|---|
| EP | Wrong handling of whole classes of input | Edges, combinations | Every partition once |
| BVA | Off-by-one, `<` vs `<=` | Combinations, sequences | Every boundary ± neighbour |
| Decision table | Missing or contradictory business rules | Ranges inside conditions | Every (collapsed) rule |
| State transition | Illegal sequences, workflow bypasses | Data values inside states | All transitions; all invalid pairs; n-switch |
| Pairwise | Two-factor configuration bugs | Single-value logic, 3+ way bugs | Every value pair |
| Use case / scenario | Workflow and integration gaps | Detailed input rules | Every main and alternative flow |
| Error guessing | Known failure patterns | Anything the tester hasn't seen before | None (that's its weakness) |
| Property-based | Unexpected inputs, edge cases nobody listed | What the generator can't produce | Number of generated cases (statistical) |
| Mutation testing | *Weak tests* (evaluates the suite) | — | Mutation score |

### Property-based testing tools

| Language | Tool | Notes |
|---|---|---|
| JavaScript / TypeScript | **fast-check** (used here) | Integrates with any runner; model-based testing support |
| Python | Hypothesis | Very mature shrinking; stateful testing; database of past failures |
| Java / Kotlin | jqwik, Kotest | JUnit 5 engine |
| Haskell / Erlang | QuickCheck | The original (2000) |
| Rust | proptest, quickcheck | |
| Go | `testing/quick`, rapid | |

### Combinatorial tools

| Tool | Notes |
|---|---|
| **Microsoft PICT** | CLI; constraints, seeding, mixed strength; the de-facto standard |
| **NIST ACTS** | Higher strengths (up to 6-way); constraint support; research-backed |
| AllPairs / allpairspy | Simple libraries for scripting |
| `labs/02-test-design/pairwise.mjs` | ~80 lines; for understanding the algorithm, not production |

### Mutation testing tools

Stryker (JavaScript, TypeScript, C#, Scala), PIT/PITest (Java), mutmut and cosmic-ray (Python), and cargo-mutants (Rust). The lab's `mutants.mjs` uses ten hand-written mutants to show the idea. Real tools generate hundreds automatically.
