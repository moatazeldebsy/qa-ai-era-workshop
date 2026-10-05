# Topic 12 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="12" markdown>

<div class="quiz-q" markdown>

**1. An AI-drafted test suite reads well and passes against the current code. What's the most important next check?**

- [ ] Count the tests
- [x] Run it against planted bugs or mutants: would it fail when the code is wrong?
- [ ] Check its formatting
- [ ] Ask the AI whether the tests are good

<div class="quiz-why" markdown>
A test that can't fail gives false confidence. The lab's draft passed 21 of 23 on correct code but caught the pricing bug with only one test.
</div>

</div>

<div class="quiz-q" markdown>

**2. Two AI-drafted tests fail against the correct shop. What should you conclude?**

- [ ] The AI hallucinated, so delete them
- [x] Investigate: they may be hallucinations, or real gaps between the spec and the code
- [ ] The shop is broken
- [ ] Mark them as skipped

<div class="quiz-why" markdown>
In the lab, both failures were real spec-versus-code gaps (a string bookId accepted; a 1001-character question accepted). Deciding which side is wrong is a human decision.
</div>

</div>

<div class="quiz-q" markdown>

**3. Why do LLM evals assert properties ("every price mentioned exists in the catalogue") instead of exact answers?**

- [ ] Exact answers are too long
- [x] Outputs vary in wording between runs and versions, but correct answers share properties
- [ ] promptfoo can't compare strings
- [ ] Properties are faster

<div class="quiz-why" markdown>
Non-determinism makes exact-match assertions brittle. Properties capture what makes an answer right or wrong.
</div>

</div>

<div class="quiz-q" markdown>

**4. Three red-team cases passed while the assistant printed its system prompt. Why?**

- [ ] The model was too fast
- [x] Each case only looked for its own symptom, and no check on every case looked for the leak
- [ ] promptfoo ignores outputs that start with "Sure!"
- [ ] The leak was in another language

<div class="quiz-why" markdown>
An assertion only catches what it looks for. Failures that matter for every input belong in checks applied to every case.
</div>

</div>

<div class="quiz-q" markdown>

**5. What is prompt injection?**

- [ ] A way to speed up prompts
- [x] Input crafted to make a model ignore or override its instructions
- [ ] A database attack
- [ ] Adding examples to a prompt

<div class="quiz-why" markdown>
It's OWASP LLM01. Every text field that reaches a model is an instruction channel, including web pages an agent reads.
</div>

</div>

<div class="quiz-q" markdown>

**6. When is a model-graded (LLM-as-judge) assertion worth its cost?**

- [ ] Always: it's the most accurate
- [x] For qualities deterministic checks can't capture, such as tone or faithfulness, and only after validating the judge against human labels
- [ ] Never
- [ ] Only for code generation

<div class="quiz-why" markdown>
Judges are AI features too: non-deterministic, costly, and possibly biased. Use deterministic checks wherever they work.
</div>

</div>

<div class="quiz-q" markdown>

**7. A model provider updates its model, and nothing in your code changes. What should happen?**

- [ ] Nothing: the code didn't change
- [x] Run the full eval suite as a release gate, because behaviour can drift without code changes
- [ ] Roll back immediately
- [ ] Only re-run unit tests

<div class="quiz-why" markdown>
Drift is a defining risk of AI features. Evals on every model, prompt or data change, plus canaries in production.
</div>

</div>

<div class="quiz-q" markdown>

**8. An AI agent reports "shipping was charged on a 59.98 EUR cart". What makes that finding trustworthy?**

- [ ] The agent sounded confident
- [x] A precise oracle (product rules), a replayable trace, and a scripted test reproducing it
- [ ] It used a large model
- [ ] It ran headed

<div class="quiz-why" markdown>
Agents can report confident, false findings, like the stale-snapshot bug the workshop's tool tests caught. Verify, then turn the finding into a regression test.
</div>

</div>

<div class="quiz-q" markdown>

**9. Why do the workshop agent's tools have their own tests that run without a model?**

- [ ] To save money only
- [x] An agent is only as reliable as its tools; a tool that reads stale page state makes the agent invent bugs
- [ ] Models can't use tested tools
- [ ] Playwright requires it

<div class="quiz-why" markdown>
Test the deterministic parts deterministically. The tool tests caught a real stale-snapshot problem.
</div>

</div>

<div class="quiz-q" markdown>

**10. What should you never paste into a public AI assistant while testing?**

- [ ] A test name
- [x] Secrets, customer data, or confidential code your organisation hasn't approved for that tool
- [ ] An error message from a public library
- [ ] A question about Playwright

<div class="quiz-why" markdown>
What you send may be stored or used by the provider. Follow your organisation's AI policy and use approved, enterprise-grade tools.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **AI is a very fast, very confident junior colleague, on both sides of the test.**
>
> When it writes tests for you, it produces volume, and you supply the judgement: review against the spec, and score by what the tests catch. When it's the feature under test, it fails plausibly, varies between runs and listens to attackers: test properties, attack it deliberately, and check that your checks would notice. Either way, an oracle you trust and evidence you can reproduce are what turn AI output into quality.

### 10 key things to remember

1. **AI drafts, people decide.** Track keep, fix and delete for every generated test.
2. **Score generated tests by what they catch:** planted bugs, mutants, real gaps.
3. **A failing generated test may be right.** Spec-versus-code gaps are findings.
4. **LLM features fail plausibly:** hallucination, injection, leakage, excessive agency, drift.
5. **Assert properties, not exact text,** with deterministic checks first.
6. **Validate any LLM judge** against human labels before trusting it.
7. **Evaluate the evaluator:** apply checks for critical failures to every case, and read what "passed".
8. **Red-team with the OWASP Top 10 for LLM Applications** as a checklist.
9. **Run evals on every prompt, model or data change,** and canaries in production.
10. **Agents need tools, an oracle and a leash,** and their findings need reproducing.

### Common mistakes

- Merging AI-generated tests because they're green.
- Judging AI output by fluency.
- Exact-match assertions on LLM output.
- Red-team cases that only check for their own symptom.
- Unvalidated LLM judges.
- Evals that run once, before launch, and never again.
- Agents with production access or unlimited budgets.
- Pasting secrets or customer data into AI tools.
- Believing an agent's finding without reproducing it.

### Hands-on challenge

**Make the assistant's quality measurable, end to end.**

1. **Metamorphic evals:** add cases that ask the same question in three phrasings ("How much is Prompting for QA?", "What does Prompting for QA cost?", "Price of Prompting for QA?") and assert the same price in each. What does the mock assistant do with the second and third?
2. **A canary:** add a unique token (for example `QB-CANARY-7f3a`) at the start of `SYSTEM_PROMPT`, and assert in `defaultTest` that it never appears in an answer. Why is a canary more robust than the phrases you used in step 3?
3. **Generate, then improve:** ask your AI assistant to *improve* the scored draft so it catches `BUG_MODE=cart` with more than one test. Score it again. Did it help, or just add tests?
4. **Stretch:** with an API key, run `eval:llm` and `eval:redteam` against `ASSISTANT_MODE=claude` three times each. Do any cases flip between runs? What pass-rate threshold would you put in the quality gate?

Share your metamorphic cases in the discussions. Which phrasings broke the mock assistant?

### What to learn next

**Topic 13 — QA Platform Engineering and Test Infrastructure.** You've built many kinds of checks for one shop. Topic 13 asks how an organisation with fifty teams gets the same quality without fifty teams rebuilding it: reusable pipelines, test templates, shared fixtures and fakes, results stores, and paved roads that make the right thing the easy thing.

Read before Topic 13 (optional):

- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
- [promptfoo documentation: assertions and red teaming](https://www.promptfoo.dev/docs/intro/)
- Hamel Husain, [*Your AI Product Needs Evals*](https://hamel.dev/blog/posts/evals/)

When you've finished the lab and the challenge, move on to [Topic 13](../13-platform/index.md).
