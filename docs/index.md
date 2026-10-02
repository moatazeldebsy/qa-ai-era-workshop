# QA Engineering in the AI Era

**Higher quality · Faster feedback · Smarter testing · Greater impact**

A hands-on workshop for QA engineers, SDETs, developers and engineering leaders. Each module covers one part of how quality engineering is changing, and eight runnable labs put it into practice on a small demo shop that includes an AI support assistant.

![QA Engineering in the AI Era: the eight themes of this workshop](assets/qa-ai-era-mindmap.png)

## What you will be able to do afterwards

- Explain how the QA role is moving from **test execution to quality enablement**, and what that means for your team.
- Use AI to **generate, review and maintain tests** without trusting it blindly.
- Build a **layered automation suite** (unit, API, E2E, performance) that gives fast, reliable feedback.
- **Test an LLM feature**: grounding, hallucination, prompt injection and scope, with an eval suite that runs in CI.
- Turn test evidence into a **release decision** with a quality gate.
- Measure quality with **MTTD, MTTR, DORA metrics and defect escape rate**, and know what each one hides.

## How the workshop is organised

| | What | Format |
|---|---|---|
| **[Modules](modules/index.md)** | Eight themes, one per box in the map above | Concepts, discussion prompts, a short exercise, role-specific takeaways |
| **[Labs](labs/index.md)** | Eight hands-on exercises on the demo app | Step-by-step, 20-45 minutes each, with stretch goals |
| **[Agendas](agendas.md)** | Half-day, full-day and two-day formats | Pick by audience and time |
| **[Reference](reference/cheat-sheet.md)** | Cheat sheet, glossary, reading list | For after the workshop |

## Three tracks, one workshop

The audience is deliberately mixed. Every module ends with **takeaways per role**, and the labs are tagged so each person can choose what to do hands-on.

=== "QA engineers & SDETs"

    All eight labs. Focus on Labs 1-7: automation, AI-assisted generation, flakiness, LLM evaluation and quality gates.

=== "Developers"

    Labs 1, 2, 4, 6 and 7. Own the tests for your own code, make LLM features testable, and wire the quality gate into your pipeline.

=== "Managers & leads"

    Modules 1, 4, 6, 7 and 8, plus Labs 7 and 8. Read the gate output and the metrics, and decide what "ready to release" means for your team.

## The demo app in one paragraph

**Quality Books** is a tiny bookshop: a catalogue, a cart with a free-shipping rule, a deliberately slow recommendations widget, and an **AI support assistant**. The assistant runs in `mock` mode by default (deterministic, no API key needed), in `buggy` mode (hallucinates, leaks its prompt, answers off-topic questions) for the evaluation lab, or against a real Claude model if you have an API key. `BUG_MODE=cart` plants a pricing regression for the quality-gate lab. See [Demo App](reference/demo-app.md).

[Get set up :material-arrow-right:](getting-started.md){ .md-button .md-button--primary }
[Jump to the labs](labs/index.md){ .md-button }
