# Topic 12 — AI in QA Engineering

*How to use AI to test, and how to test AI, without trusting either blindly.*

Two sides of one topic. **AI for testing:** you'll score an AI-drafted test suite objectively, not by how plausible it looks, and meet an AI agent that explores the shop through a browser. **Testing AI:** you'll evaluate the shop's AI support assistant for grounding, scope and safety, attack it with a red team, and then evaluate the evaluator. In this repo, three red-team cases report "resisted" while the assistant leaks its instructions.

Everything in this topic runs **without an API key**. The assistant has a deterministic `mock` mode and a deliberately `buggy` one. A real-model route is optional throughout.

<div class="topic-progress" data-topic="12"></div>

## What you'll be able to do

- Decide where AI helps in testing, and where it quietly makes things worse.
- Review and score AI-generated tests against a spec, planted bugs and a checklist.
- Explain how LLM features fail: hallucination, prompt injection, leakage, excessive agency, drift.
- Build evals with deterministic, programmatic and model-graded assertions, and know each one's limits.
- Red-team an LLM feature against the OWASP Top 10 for LLM Applications.
- Use agents for exploratory testing with tools, an oracle and a short leash.

## Before you start

Finish [Topic 11](../11-quality-intelligence/index.md) first. You need Node 22.22 or newer for promptfoo (`nvm use` picks Node 24) and Chromium. An `ANTHROPIC_API_KEY`, Claude Code or GitHub Copilot agent mode is optional, for step 4's real agent run.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: AI-assisted testing, review, LLM failure modes, evals, guardrails, drift, agents, responsible AI | ~2.5 h |
| [Lab](lab.md) | Score an AI-drafted suite, evaluate the assistant, fix a blind red team, meet the agent | ~2.5 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 12    # your own branch for this topic
npm run learn:check 12    # after each lab step: ✔ or what's missing
```

## What you'll come away with

- A habit: score AI output by what it catches, not by how it reads.
- An eval and red-team suite whose blind spot you found and fixed.
- A clear view of what an AI testing agent needs: tools, an oracle and limits.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions) under **Topic 12**. When you've finished, post your notebook or your challenge solution there too.
