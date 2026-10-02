# Lab 6 — Evaluating an LLM feature

**Time:** 45 min · **Tracks:** All · **Module:** [5. Quality Focus Areas for AI](../modules/05-quality-focus-areas.md)

## Goal

Build a regression suite (an **eval**) for the shop's AI assistant that catches hallucination, prompt-injection leaks and off-topic answers, and run it the way you'd run any test suite.

## Files

- `labs/llm-eval/promptfooconfig.yaml`: nine eval cases with deterministic assertions
- `app/src/assistant.js`: the assistant and its three modes
- Output: `test-results/llm-eval.json`

## The assistant's modes

| `ASSISTANT_MODE` | Behaviour | Use |
|---|---|---|
| `mock` (default) | Deterministic and grounded in the catalogue | Baseline, CI |
| `buggy` | Invents books and prices, leaks its system prompt, answers off-topic | Practise catching failures |
| `claude` | A real model (`ANTHROPIC_API_KEY` required) | Optional: evaluate the real thing |

## Steps

**1. Baseline.** Start the app (`npm start`), then:

```bash
npm run eval:llm
```

All nine cases pass. Open the results in a browser with `npm run eval:llm:view`.

**2. Read the cases.** They fall into three groups:

- **Grounding**: real prices, out-of-stock status, a book that doesn't exist, "every price mentioned is in the catalogue" (a JavaScript assertion).
- **Policy**: shipping and returns answers.
- **Guardrails**: prompt injection, medical and financial off-topic questions.

The `defaultTest` block applies to every case: no `<script`, and no system prompt in the output.

**3. Ship a "model update".** Stop the app and start it in buggy mode:

```bash
npm run start:buggy
npm run eval:llm      # in the other terminal
```

Six of nine cases fail. Open the viewer and read *why* each one failed. These are the real failure modes of LLM features: a confident invented book, a discounted price that doesn't exist, the system prompt printed on request.

**4. Add your red-team cases.** Take the two best questions from the Module 5 exercise and add them as tests. Run against `buggy` (should fail) and `mock` (should pass). If a case passes against `buggy`, your assertion isn't testing what you think.

**5. Try to break the mock.** Find a question where the *mock* assistant gives a wrong or unhelpful answer. Write the case, watch it fail, then fix `mockAnswer` in `app/src/assistant.js`. This is the eval-driven development loop.

## Optional: a real model

```bash
export ANTHROPIC_API_KEY=sk-ant-...
ASSISTANT_MODE=claude npm start
npm run eval:llm
```

Some deterministic assertions may now fail even when the answer is fine (the model phrases "out of stock" differently). That's the next lesson: for real models, mix deterministic checks with **model-graded** ones. Uncomment the `llm-rubric` example at the end of the config. Each run costs a little money; run it a few times and look for cases that pass *sometimes*.

## Stretch goals

- Add a **bias check**: ask for a recommendation "for my daughter" and "for my son" and assert the answers recommend the same books.
- Add a **cost or latency** assertion (promptfoo supports `cost` and `latency` assertion types) for `claude` mode.
- Save one real customer-style conversation per week as a new eval case. That is how eval sets grow in practice.

## Debrief

1. Which failure in `buggy` mode would have reached customers without this suite?
2. When is a deterministic assertion enough, and when do you need a model-graded one?
3. Who in your team should own the eval dataset?
