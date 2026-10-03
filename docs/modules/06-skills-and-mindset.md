# 6. Skills & Mindset

*New skills for a new era*

## Why it matters

The tools change every year; the skills underneath them change slowly. This module is about the skills that compound: the ones worth investing in whatever the next tool turns out to be.

## Key ideas

### Data literacy and AI fluency

- **Data literacy:** read a distribution rather than an average, spot a biased sample, know when a percentage needs a denominator. Lab 8 practises this.
- **AI fluency:** know roughly how LLMs work (tokens, context, sampling, why they hallucinate), how to prompt them, and, most importantly, **where they fail**. Fluency means knowing when *not* to use AI.

### Analytical and problem-solving skills

Debugging is the core QA skill and AI doesn't replace it: form a hypothesis, find the cheapest experiment that could disprove it, run it. Lab 4 (flaky tests) is a small example: the hypothesis is "timing", and the experiment is "run it ten times".

### Automation and scripting (Python, etc.)

You don't need to be a framework author. You do need to be comfortable reading and writing scripts in your team's language: a test, a data generator, a CI step. This workshop uses JavaScript for tests and Python for metrics on purpose, as a reminder that the skill is scripting, not one language.

### System thinking and domain knowledge

Bugs live at the boundaries: between services, between teams, between the model and the data. Know how the system fits together (draw it!) and know the business well enough to know which failure would hurt most. Domain knowledge is what lets you write the test an AI wouldn't think of.

### Curiosity and continuous learning

Set aside learning time and protect it. A useful habit: each sprint, read one post-mortem from another team and one release note from a core tool.

### Collaboration and communication

The role is increasingly about influence: explaining a risk to a product manager in customer terms, persuading a developer to add a test, writing a bug report someone can act on in one read.

## A self-assessment

Rate yourself 1-5 on each, then pick **one** to grow over the next quarter.

| Skill | 1 | 3 | 5 |
|---|---|---|---|
| Data literacy | Reports averages | Questions the denominator | Designs the metric |
| AI fluency | Avoids or over-trusts AI | Uses it, reviews output | Knows where it fails, teaches others |
| Problem solving | Reports symptoms | Isolates causes | Finds the systemic cause |
| Automation | Runs others' scripts | Writes and maintains tests | Designs the test architecture |
| System thinking | Knows their component | Knows the end-to-end flow | Predicts where it will break |
| Communication | Files tickets | Explains risk in customer terms | Changes decisions |

## Discuss

1. Which skill above has grown most in your team in the last year? Which has been neglected?
2. How does your team share what it learns?

## Exercise (10 min)

Fill in the self-assessment. Pair up and agree one concrete learning action each, such as "pair with a developer on Lab 6's eval suite" or "run Lab 8 on our real incident data".

## Takeaways by role

=== "QA & SDET"
    Invest in AI fluency *and* domain depth. The combination is rare and valuable.

=== "Developers"
    Testing skill is engineering skill. The developers who write the best tests write the best code.

=== "Managers & leads"
    Budget learning time explicitly, and use the self-assessment in career conversations.

## Next steps

<div class="grid cards" markdown>

-   **Module 7 — Success Metrics**

    ---

    Measure what matters, and know what each metric hides.

    [→ Module 7](07-success-metrics.md)

-   **Labs**

    ---

    Put the skills to work on the demo app.

    [→ Labs](../labs/index.md)

</div>
