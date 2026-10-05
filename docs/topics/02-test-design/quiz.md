# Topic 2 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="02" markdown>

<div class="quiz-q" markdown>

**1. Valid quantities are 1 to 10. Which set is the minimum for two-value boundary analysis on both boundaries?**

- [ ] 1 and 10
- [x] 0, 1, 10 and 11
- [ ] 0, 5 and 11
- [ ] 1, 5 and 10

<div class="quiz-why" markdown>
Two-value BVA tests each boundary and its nearest neighbour in the next partition. Three-value BVA would add 2 and 9.
</div>

</div>

<div class="quiz-q" markdown>

**2. Why should each test use only one invalid partition?**

- [ ] To keep tests short
- [x] Because the first error can mask the second, so one of them goes untested
- [ ] Because test runners can't report two failures
- [ ] Because invalid values are rare in production

<div class="quiz-why" markdown>
If quantity is 0 *and* the book id is unknown, you only see whichever check runs first. The other check could be broken and you'd never know.
</div>

</div>

<div class="quiz-q" markdown>

**3. A rule depends on three yes/no conditions. How many columns does the full decision table have before collapsing?**

- [ ] 3
- [ ] 6
- [x] 8
- [ ] 9

<div class="quiz-why" markdown>
2³ = 8. Collapsing merges columns where a condition doesn't matter, but the merged claim ("if late, nothing else matters") still deserves tests.
</div>

</div>

<div class="quiz-q" markdown>

**4. Which approach is most likely to catch "a shipped order can still be cancelled"?**

- [ ] Testing every valid transition once
- [x] Testing every invalid state/event pair
- [ ] Pairwise testing
- [ ] Boundary value analysis

<div class="quiz-why" markdown>
0-switch coverage takes every arrow that *should* exist. Only testing the empty cells of the state table catches an arrow that *shouldn't* exist.
</div>

</div>

<div class="quiz-q" markdown>

**5. Factors with 3, 3, 3, 2 and 2 values need 108 configurations for all combinations. What is the theoretical minimum for covering every pair?**

- [ ] 5
- [ ] 6
- [x] 9
- [ ] 27

<div class="quiz-why" markdown>
Every value of the largest factor must meet every value of the second-largest: 3 × 3 = 9. The lab's greedy generator found 11.
</div>

</div>

<div class="quiz-q" markdown>

**6. A property passed 100 random runs, yet the duplicate-line bug was there all along. What's the most likely reason?**

- [ ] 100 runs is too few
- [x] The generator could never produce the triggering input
- [ ] Properties can't find business bugs
- [ ] The bug was flaky

<div class="quiz-why" markdown>
`fc.uniqueArray` never generates the same book twice. Generators encode assumptions, so ask what yours can *never* produce.
</div>

</div>

<div class="quiz-q" markdown>

**7. Which of these is a metamorphic relation for the cart?**

- [ ] The total is a number
- [x] Reversing the order of lines doesn't change the total
- [ ] The total for 2 × 29.99 is 59.98
- [ ] An unknown book is rejected

<div class="quiz-why" markdown>
A metamorphic relation links the outputs of related inputs. You don't need the right total, only the knowledge that both orders must give the same one.
</div>

</div>

<div class="quiz-q" markdown>

**8. Mutant M4 (`>` instead of `>=` at 50 EUR) was killed only by boundary tests. Why did the property tests miss it?**

- [ ] Properties ignore shipping
- [x] No sellable cart costs exactly 50.00 EUR, so random carts never land on the boundary
- [ ] fast-check doesn't support comparisons
- [ ] The mutant was equivalent

<div class="quiz-why" markdown>
Random inputs rarely hit exact boundaries, and here they can't. That's why examples on the boundary and properties across the space complement each other.
</div>

</div>

<div class="quiz-q" markdown>

**9. What does shrinking give you when a property fails?**

- [ ] A faster test run
- [x] A small, simple input that still fails, which is easier to debug
- [ ] A fix for the bug
- [ ] Proof that the bug is the only one

<div class="quiz-why" markdown>
fast-check simplifies the failing input step by step and keeps the smallest one that still fails. The printed seed lets you replay the exact run.
</div>

</div>

<div class="quiz-q" markdown>

**10. How is a mutation score different from code coverage?**

- [ ] It's the same number measured differently
- [x] It measures whether tests detect injected bugs, not just whether code ran
- [ ] It only counts unit tests
- [ ] It measures how fast tests run

<div class="quiz-why" markdown>
Coverage is necessary but says nothing about assertions. A mutant survives when no test notices the change, which points straight at a blind spot.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **A test design technique is a lens that makes one shape of bug visible.**
>
> Partitions and boundaries see *ranges*. Decision tables see *combinations*. State machines see *history*. Pairwise sees *configurations*. Properties see *the whole input space, through the generator's eyes*. Error guessing sees *what has gone wrong before*.
>
> Every lens is blind somewhere. A strong suite looks through several lenses, and mutation testing shows where you're still blind.

### 10 key things to remember

1. **One value per partition, and one invalid partition per test.** Combining invalid values hides bugs.
2. **Bugs live on boundaries.** Test on, below and above, and ask the requirement which side the boundary belongs to.
3. **Building the model finds bugs** before any test runs: unanswered columns, missing arrows, undefined boundaries.
4. **Test the empty cells** of a state table. Invalid transitions are where workflow and security bugs hide.
5. **Decision tables expose rule order.** When conditions overlap, order is behaviour, so test the overlaps.
6. **Pairwise gets about 10% of the cost for most interaction bugs.** Seed your riskiest real configurations, and remember it isn't three-way.
7. **Properties need real oracles**: invariants, metamorphic relations, reference models.
8. **Generators encode assumptions.** Ask what your generator can never produce.
9. **Pin seeds in CI, explore randomly locally.** A failure you can't replay is a failure you can't fix.
10. **Judge a suite by the bugs it catches.** Mutation scores tell you that; coverage doesn't.

### Common mistakes

- Deriving partitions from the **code** and so testing that bugs are still there.
- Testing **only valid** partitions.
- Testing the boundary but not its **neighbour** (or the reverse).
- Writing a 32-column decision table and **never collapsing** it, or collapsing it and **never testing** the "doesn't matter" claim.
- Drawing the state diagram but testing only the **happy path**.
- Treating a pairwise matrix as **proof** of compatibility.
- Writing properties so weak they can't fail (`result !== undefined`).
- Restricting generators "to avoid noise", and filtering out the bugs with the noise.
- Chasing **100% code coverage** instead of covering the model.
- Using one technique for everything because it's the one the team knows.

### Hands-on challenge

**Resolve the assistant's routing question, then add a bulk discount.**

1. **Routing.** Decide the right answer for *"Will bad weather delay my delivery?"*. Extend the assistant's decision table with every combination of *off-topic* and *mentions shipping/returns/contact*, decide each column, change `mockAnswer()` to match, and turn the R6 TODO into a passing test. Check that `npm run eval:llm` (the LLM evaluation suite from Topic 12) still passes. Did your change let any genuinely off-topic question through?
2. **Bulk discount.** Product asks: *"10% off a line of 5 or more copies; never on out-of-stock books; doesn't combine with free shipping below 50 EUR after discount."* Build:
    - a partition and boundary table for the discount quantity (4, 5, 6)
    - a decision table for *discount × free shipping* (does free shipping use the subtotal before or after the discount? Decide and document it)
    - two properties: *a discounted line never costs more than the undiscounted one*, and *ordering lines still doesn't change the total*
3. Add two mutants for your feature to `mutants.mjs` (for example, discount at ≥ 4, or discount applied after shipping) and show that each one is killed by a technique you used.

### What to learn next

**Topic 3 — Unit and Component Testing.** You now know *which* tests to write. Topic 3 is about *how* to write them well at the cheapest level: what a "unit" really is, test doubles (stubs, mocks, fakes, spies) and when they lie, test structure and naming, fast and deterministic tests, TDD, testing time and randomness, coverage tools, and full mutation testing with Stryker on this repo.

Read before Topic 3 (optional):

- Lee Copeland, *A Practitioner's Guide to Software Test Design*: the classic reference for every technique in this topic
- [fast-check documentation](https://fast-check.dev/): *Why property-based?* and *Model-based testing*
- NIST, [*Practical Combinatorial Testing*](https://csrc.nist.gov/pubs/sp/800/142/final) (SP 800-142)

When you've finished the lab and the challenge, say **"continue"** to start Topic 3.
