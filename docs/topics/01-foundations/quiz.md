# Topic 1 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="01" markdown>

<div class="quiz-q" markdown>

**1. Your suite is green and covers 92% of the lines. What can you conclude?**

- [ ] There are no bugs in the covered code.
- [x] No test observed a failure for the inputs it happened to run.
- [ ] Every risk in the register is covered.
- [ ] The release is ready.

<div class="quiz-why" markdown>
Testing shows the presence of defects, never their absence. Coverage says which lines *ran*, not what was *checked*: in the bug hunt, `cart.js` had high coverage and six of eight tests still missed the bug.
</div>

</div>

<div class="quiz-q" markdown>

**2. The policy says "over 50 EUR", the contract and the code say "50 EUR or more". Which kind of oracle finds this?**

- [ ] A specified oracle
- [ ] An invariant
- [x] A consistency oracle
- [ ] Only human judgement

<div class="quiz-why" markdown>
A consistency oracle compares sources of truth with each other. It tells you *that* they disagree. Deciding *which* one is right is a product decision.
</div>

</div>

<div class="quiz-q" markdown>

**3. A fault sits in code that has run thousands of times in production without anyone seeing a failure. How is that possible?**

- [ ] It isn't: code that runs is tested.
- [x] A fault only causes a failure when it runs with an input that triggers it.
- [ ] Production hides failures from users.
- [ ] The fault must be in dead code.

<div class="quiz-why" markdown>
Error → fault → failure: a fault becomes a visible failure only with the right input and state. That's why choosing inputs (Topic 2) is most of the skill.
</div>

</div>

<div class="quiz-q" markdown>

**4. No combination of books costs exactly 50.00 EUR, so no API or UI test can check that boundary. Which part of testability is missing?**

- [x] Controllability
- [ ] Observability
- [ ] Performance
- [ ] Portability

<div class="quiz-why" markdown>
Controllability is the ability to put the system into the state you need. The fix was a design change, a seam (`shippingFor()`), not more tests.
</div>

</div>

<div class="quiz-q" markdown>

**5. A risk register entry points to a test that was renamed last month. Why is that worse than having no entry at all?**

- [ ] It makes the register longer.
- [x] It claims coverage that no longer exists, so the risk looks handled when it isn't.
- [ ] The test will fail in CI.
- [ ] Renamed tests are always flaky.

<div class="quiz-why" markdown>
A broken trace is false confidence. That's why `risks.mjs` opens each file and checks the test title is really there.
</div>

</div>

<div class="quiz-q" markdown>

**6. The checkout matches its specification exactly, but customers keep misunderstanding when shipping is free. Which statement fits?**

- [ ] It fails verification and passes validation.
- [x] It passes verification and fails validation.
- [ ] It fails both.
- [ ] It passes both, so there's no quality problem.

<div class="quiz-why" markdown>
Verification asks *did we build it right?* (does it match the spec?). Validation asks *did we build the right thing?* (does it meet the real need?).
</div>

</div>

<div class="quiz-q" markdown>

**7. In the bug hunt, the 49.99 / 50.00 / 50.01 tests stayed green on the buggy code. Why?**

- [ ] Boundary tests never find bugs.
- [x] They test `shippingFor()` directly; the bug was in what got passed to it.
- [ ] The bug only happens in production.
- [ ] They were marked as TODO.

<div class="quiz-why" markdown>
A unit test on a seam doesn't test the wiring around the seam. The 2 × 29.99 cart and the invariant sweep went through `priceCart`, so they saw the bug.
</div>

</div>

<div class="quiz-q" markdown>

**8. The company name is misspelt on the home page. How would you classify it?**

- [ ] High severity, high priority
- [x] Low severity, high priority
- [ ] High severity, low priority
- [ ] Low severity, low priority

<div class="quiz-why" markdown>
Severity is technical impact (small here). Priority is how soon the business wants it fixed (soon: it's the first thing every customer sees).
</div>

</div>

<div class="quiz-q" markdown>

**9. You want to check *total = subtotal + shipping* on every sellable cart. Where should that check live?**

- [ ] In an E2E test that clicks through every cart
- [x] In a unit or component test that calls the pricing code directly
- [ ] In production monitoring only
- [ ] In a manual regression checklist

<div class="quiz-why" markdown>
Put each check at the lowest level that can see the risk. At unit level, about 19,000 carts take milliseconds. Through the browser, it would take days.
</div>

</div>

<div class="quiz-q" markdown>

**10. Three sources disagree about a rule: the API contract, the code and a help-page sentence. Which one should you change first?**

- [ ] The API contract, because it's the most formal
- [ ] The code, because it's what customers experience
- [x] The least authoritative source (here the help text), moving it towards the most authoritative one
- [ ] All three, to a new agreed wording

<div class="quiz-why" markdown>
Changing the contract or the code is a breaking change for clients and existing tests. Changing a help sentence surprises no one. Once the decision is made, add a consistency test so the sources can't drift apart again.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **Quality engineering is a feedback system for decisions under uncertainty.**
>
> Risks tell you **where to look**. Oracles tell you **what "right" means**. Tests are **instruments** that turn behaviour into evidence. People turn evidence into **decisions**. Production and escaped defects tell you **where your instruments were blind**, and you feed that back into the risks.

If you remember one picture, make it the loop in section 3. Every later topic is a better instrument for one part of it.

### 10 key things to remember

1. **Quality is value to someone who matters.** Always ask *"to whom?"*
2. **A test without an oracle is just execution.** Decide what "correct" means before you automate.
3. **Testing shows the presence of bugs, never their absence.** Green means "we didn't see a failure".
4. **Prioritise by risk (likelihood × impact)**, in customer terms, and write the decision down.
5. **Faults only fail with the right input.** Choosing inputs (Topic 2) is most of the skill.
6. **Verification ≠ validation.** A product can match a wrong spec perfectly.
7. **Testability is a design property.** Raise it in design review, not after the fact.
8. **Put each check at the lowest level that can see the risk.** Use higher levels only for what lower ones can't see.
9. **Every fixed defect gets a regression check**, or you'll fix it again.
10. **Measure whether tests catch bugs, not just whether they run.** Plant bugs; don't trust coverage alone.

### Common mistakes

- Treating QA as a **phase** or a **team** rather than a property everyone builds.
- Equating **test count or coverage** with quality.
- Writing tests that **assert nothing meaningful** (`status === 200`).
- Fixing an inconsistency by changing the **most** authoritative source (the contract) instead of the least.
- Keeping a risk register nobody updates, or one that traces to **tests that no longer exist**.
- Exploring without a **charter** or a **timebox**, and then not being able to say what was covered.
- Filing defects that describe the **symptom** without the **impact** ("button broken" instead of "customers can't check out on Safari").
- Using **retries** to make a suite green.
- Copying **production data** into test environments "just for now".

### Hands-on challenge

**The "buy 2, get 10% off" feature.** Product wants a new rule: *"Buy 2 or more copies of the same book and get 10% off that line."*

1. **Before writing code**, list at least five questions this requirement leaves open. (Hints: does the discount apply before the free-shipping check? How is 10% rounded? Does it combine with other lines? What about exactly 2?)
2. Add two risks for the feature to the register, scored, and make `npm run foundations:risks` fail because they're uncovered.
3. Implement the rule in `priceCart` (agree your answers to step 1 first, in writing).
4. Add tests with **all three oracle types**: a specified example, an invariant that holds for every sellable cart (for example, *a discounted line is never more than the undiscounted one*), and a consistency check against a sentence you add to `policies`.
5. Make the risk register pass again.
6. Plant your own bug (for example, apply the discount at quantity ≥ 3) and show that at least one of your tests catches it.

Compare your step 1 list with someone else's. Most teams find that the questions are worth more than the code.

### What to learn next

**Topic 2 — Test Design Techniques.** In this topic you chose 49.99, 50.00 and 50.01 by instinct. Topic 2 makes that systematic: equivalence partitioning, boundary value analysis, decision tables, state transitions, pairwise and combinatorial testing, and property-based testing. They answer the question this topic left open: out of 19,000 carts (and infinitely many assistant questions), which few tests are worth writing?

Read before Topic 2 (optional):

- Michael Bolton, [*Testing Without a Map*](https://developsense.com/articles/2005-01-TestingWithoutAMap.pdf) (FEW HICCUPPS oracles)
- ISTQB, [*Certified Tester Foundation Level Syllabus v4.0*](https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/), chapter 1
- Martin Fowler, [*The Practical Test Pyramid*](https://martinfowler.com/articles/practical-test-pyramid.html)

When you've finished the lab and the challenge, move on to [Topic 2](../02-test-design/index.md).
