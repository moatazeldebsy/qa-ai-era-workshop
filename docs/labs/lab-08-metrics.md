# Lab 8 — Measuring what matters

**Time:** 30 min · **Tracks:** All · **Module:** [7. Success Metrics](../modules/07-success-metrics.md)

## Goal

Compute MTTD, MTTR, the DORA metrics and the defect escape rate from raw data, and find what the headline numbers hide.

## Files

- `labs/metrics/quality_metrics.py`: one small, readable function per metric (standard library only)
- `labs/metrics/data/deployments.csv`: 40 deployments in September
- `labs/metrics/data/incidents.csv`: 6 incidents, with what detected them and which deploy caused them
- `labs/metrics/data/defects.csv`: 12 defects, with where they were found

## Steps

**1. Run it.**

```bash
npm run metrics
```

```text
MTTD (mean time to detect)          34.8 min
MTTR (mean time to resolve)         46.8 min
Deployment frequency                1.37 /day
Lead time for changes (median)       5.0 h
Change failure rate                10.0%
Defect escape rate                 25.0%

MTTD by detection source (min):
  alert                   3.0
  customer-report        97.5
  llm-eval-canary         3.5
  synthetic-monitor       4.0
```

**2. Question the headline.** Is a 35-minute MTTD good? Look at the breakdown: everything *we* detect is found in minutes, while customer-reported incidents take over an hour and a half. What should the team change?

**3. Question the definitions.** Read the functions in `quality_metrics.py`. For each, ask whether you agree:

- MTTR is measured from **detection**. Some teams measure from start. What changes?
- Lead time uses the **median**. Why not the mean? Try it.
- Defect escape rate counts production defects. What about defects nobody reported?

Change one definition and re-run.

**4. Find the missing layer.** The last section lists which test layer *should* have caught each production defect. Map each to a lab in this workshop. Which lab would you run with your team first?

**5. Use your own data (optional).** Export a month of your team's deployments and incidents into the same CSV shape and run the script. Most teams are surprised by at least one number.

## Stretch goals

- Add **MTTD per severity**: are sev1 incidents detected faster than sev3?
- Plot deployments per week and change failure rate per week (matplotlib, or paste the `--json` output into a spreadsheet).
- Add a **"time to restore after a failed deployment"** metric by joining `incidents.csv` to `deployments.csv` on `caused_by_deploy`.

## Debrief

1. Which number surprised you? Which would you put on your team's wall?
2. Which of these metrics could be gamed, and how?
3. What decision would you make differently with these numbers?
