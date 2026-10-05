# Lab 8 — Measuring what matters

Compute MTTD, MTTR, the four DORA metrics and the defect escape rate from raw data, then find what the headline numbers hide.

By the end you'll have:

- **computed** seven quality and delivery metrics from a month of sample data
- **broken down** an average that looks fine into the part that isn't
- **questioned and changed** a metric's definition, and seen the number move
- a script you can **run on your own team's data**

**Time:** 30 min · **Tracks:** All · **Module:** [7. Success Metrics](../modules/07-success-metrics.md)

## Prerequisites

- **Python ≥ 3.9**. The script uses only the standard library, so there's nothing to install.

| File | What's in it |
|---|---|
| `labs/11-quality-intelligence/metrics/quality_metrics.py` | One short, readable function per metric |
| `labs/11-quality-intelligence/metrics/data/deployments.csv` | 40 deployments in September |
| `labs/11-quality-intelligence/metrics/data/incidents.csv` | 6 incidents: what detected them, and which deploy caused them |
| `labs/11-quality-intelligence/metrics/data/defects.csv` | 12 defects, and where each was found |

## 1. Run it

```bash
npm run metrics
```

```text title="Expected output"
Quality & delivery metrics
--------------------------------------------
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

Production defects by the layer that missed them:
  api                       1
  e2e                       1
  unit                      1
```

## 2. Question the headline

Is a 35-minute MTTD good? Look at the breakdown. Everything **we** detect is found in 3–4 minutes. Incidents **customers** report take over an hour and a half to reach us.

!!! question "Discuss"
    The average says "fine". The breakdown says "we have a monitoring gap, and customers are filling it." Which incidents were customer-reported, and what synthetic monitor or alert would have caught them?

## 3. Question the definitions

Every metric is a small function. Read them and decide whether you agree:

=== "MTTR"

    ```python title="labs/11-quality-intelligence/metrics/quality_metrics.py"
    def mttr(incidents):
        """Mean time to resolve, measured from detection (some teams measure from start)."""
        return statistics.mean(minutes(i["detected_at"], i["resolved_at"]) for i in incidents)
    ```

    Change it to measure from `started_at`. What happens to the number, and which definition would your customers use?

=== "Lead time"

    ```python title="labs/11-quality-intelligence/metrics/quality_metrics.py"
    def lead_time_hours(deployments):
        """Median commit -> production. Median, because one stuck change skews a mean."""
        return statistics.median(...)
    ```

    Switch to `statistics.mean` and compare.

=== "Defect escape rate"

    ```python title="labs/11-quality-intelligence/metrics/quality_metrics.py"
    def defect_escape_rate(defects):
        """Share of defects first found in production rather than before release."""
    ```

    What about defects in production that nobody has reported? This metric can't see them.

Change one definition and run `npm run metrics` again.

## 4. Find the missing layer

The last section of the output lists which test layer **should** have caught each production defect. Map each one to a lab in this workshop: unit and API tests are [Lab 2](lab-02-api-testing.md), E2E is [Lab 1](lab-01-playwright-e2e.md). Which lab would you run with your team first?

## 5. (Optional) Use your own data

Export a month of your team's deployments and incidents in the same CSV columns and run:

```bash
python3 labs/11-quality-intelligence/metrics/quality_metrics.py path/to/your/data
python3 labs/11-quality-intelligence/metrics/quality_metrics.py path/to/your/data --json    # for a spreadsheet or dashboard
```

Most teams are surprised by at least one number.

## The whole lab, end to end

```bash
npm run metrics                                                  # 1. compute
# 2. read the MTTD breakdown
# 3. change one definition in quality_metrics.py, re-run
python3 labs/11-quality-intelligence/metrics/quality_metrics.py labs/11-quality-intelligence/metrics/data --json  # machine-readable
```

## Stretch goals

- Add **MTTD per severity**: are sev1 incidents detected faster than sev3?
- Plot deployments per week and change failure rate per week (matplotlib, or the `--json` output in a spreadsheet).
- Add **time to restore after a failed deployment** by joining `incidents.csv` to `deployments.csv` on `caused_by_deploy`.

## Debrief

1. Which number surprised you? Which would you put on your team's wall?
2. Which of these metrics could be gamed, and how?
3. What decision would you make differently with these numbers?

## Next steps

<div class="grid cards" markdown>

-   **Module 7 — Success Metrics**

    ---

    What each metric tells you and what it hides, and why coverage is a floor, not a goal.

    [→ Module 7](../modules/07-success-metrics.md)

-   **Module 8 — The Future**

    ---

    Agents, autonomous quality systems, and what stays human.

    [→ Module 8](../modules/08-the-future.md)

</div>
