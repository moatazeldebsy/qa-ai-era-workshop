# 7. Success Metrics

*Measure what matters*

## Why it matters

What gets measured gets optimised, including the wrong things. A team measured on "number of test cases" writes many test cases. This module covers the metrics that track *outcomes*, how to compute them, and how each one can mislead.

## The metrics

| Metric | Definition | Tells you | Can hide |
|---|---|---|---|
| **MTTD**: mean time to detect | incident start → detected | How good your monitoring is | Averages hide a slow tail; customer-reported incidents start the clock late |
| **MTTR**: mean time to resolve | detected → resolved | How quickly you recover | Whether the fix was a rollback or a real fix |
| **Test coverage**: code, API, E2E | share of code / endpoints / journeys exercised | Where there are *no* tests | Whether the tests assert anything |
| **Defect escape rate** | defects found in production ÷ all defects | How effective pre-release testing is | Defects nobody reported |
| **Deployment frequency** | deployments per day | Delivery capability (DORA) | Size and risk of each deployment |
| **Lead time for changes** | commit → production | Speed of the feedback loop (DORA) | Waiting in review vs in pipelines |
| **Change failure rate** | failed deployments ÷ all deployments | Release quality (DORA) | Failures rolled back before anyone noticed |
| **Customer satisfaction / feedback** | CSAT, NPS, support tickets, thumbs-down on AI answers | What customers actually experience | Silent churn |

## Key ideas

### Pair speed with stability

The DORA research found speed and stability go **together** in high performers. Always read deployment frequency and lead time next to change failure rate and MTTR. Optimising one pair alone is how you get either a fast, fragile system or a safe, frozen one.

### Coverage is a floor, not a goal

80% line coverage with no assertions is 0% verification. Use coverage to find *untested* code, and mutation testing (deliberately breaking code to see if tests notice) to judge whether the tests are worth anything. Lab 7's `BUG_MODE=cart` is a hand-made mutation.

### Break averages down

Lab 8's data has an MTTD of about 35 minutes. Broken down by detection source:

| Detected by | MTTD |
|---|---|
| Alert | 3 min |
| LLM-eval canary | 3.5 min |
| Synthetic monitor | 4 min |
| **Customer report** | **97.5 min** |

The average says "fine". The breakdown says "we have a monitoring gap, and customers are filling it."

### Metrics for AI features

Add to the list: eval pass rate per release, refusal rate, hallucination rate on a sampled set, cost per conversation, and the share of AI-generated tests kept after review.

### Use metrics for learning, not targets

When a metric becomes a target, people game it. Review metrics as a team, ask *why* they moved, and change the system rather than the number.

## Discuss

1. Which of these metrics does your team track? Which drives decisions?
2. What is your defect escape rate, and do you trust the number?
3. Which metric in your organisation is gamed today?

## Exercise (10 min): pick three

Choose the three metrics you'd put on your team's wall. For each, write who looks at it, how often, and what decision it informs. If you can't name a decision, drop the metric.

## Takeaways by role

=== "QA & SDET"
    Tag every escaped defect with the layer that should have caught it. It turns post-mortems into a test backlog.

=== "Developers"
    Lead time and change failure rate are *your* feedback on how well the pipeline serves you. Use them to ask for improvements.

=== "Managers & leads"
    Never set a coverage target. Ask instead: "what escaped last month, and what did we change?"

## Practise it

- [Lab 8: Measuring what matters](../labs/lab-08-metrics.md)
