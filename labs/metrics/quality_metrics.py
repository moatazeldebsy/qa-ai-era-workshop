#!/usr/bin/env python3
"""Lab 8 - compute the quality and delivery metrics from raw event data.

    python3 labs/metrics/quality_metrics.py labs/metrics/data
    python3 labs/metrics/quality_metrics.py labs/metrics/data --json

Inputs (CSV, see labs/metrics/data/):
  deployments.csv  id, service, committed_at, deployed_at, status
  incidents.csv    id, service, severity, started_at, detected_at, resolved_at,
                   detected_by, caused_by_deploy
  defects.csv      id, found_in, severity, component, escaped_test_layer

Standard library only, so it runs anywhere Python 3.9+ does. Every metric is a
small function: read it, question its definition, change it - that is the lab.
"""
from __future__ import annotations

import csv
import json
import statistics
import sys
from datetime import datetime
from pathlib import Path

PRE_RELEASE = {"unit", "api", "e2e", "llm-eval", "code-review"}


def parse(ts: str) -> datetime:
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")


def read(path: Path) -> list[dict]:
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def minutes(a: str, b: str) -> float:
    return (parse(b) - parse(a)).total_seconds() / 60


def mttd(incidents: list[dict]) -> float:
    """Mean time to detect: incident start -> someone (or something) noticed."""
    return statistics.mean(minutes(i["started_at"], i["detected_at"]) for i in incidents)


def mttr(incidents: list[dict]) -> float:
    """Mean time to resolve, measured from detection (some teams measure from start)."""
    return statistics.mean(minutes(i["detected_at"], i["resolved_at"]) for i in incidents)


def deployment_frequency(deployments: list[dict]) -> float:
    """Deployments per day over the observed window."""
    times = sorted(parse(d["deployed_at"]) for d in deployments)
    days = max((times[-1] - times[0]).total_seconds() / 86400, 1)
    return len(times) / days


def lead_time_hours(deployments: list[dict]) -> float:
    """Median commit -> production. Median, because one stuck change skews a mean."""
    return statistics.median(minutes(d["committed_at"], d["deployed_at"]) / 60 for d in deployments)


def change_failure_rate(deployments: list[dict]) -> float:
    return sum(d["status"] == "failed" for d in deployments) / len(deployments)


def defect_escape_rate(defects: list[dict]) -> float:
    """Share of defects first found in production rather than before release."""
    return sum(d["found_in"] == "production" for d in defects) / len(defects)


def detection_by_source(incidents: list[dict]) -> dict[str, float]:
    """Who finds incidents? Customer-reported ones are a monitoring gap."""
    out: dict[str, list[float]] = {}
    for i in incidents:
        out.setdefault(i["detected_by"], []).append(minutes(i["started_at"], i["detected_at"]))
    return {k: round(statistics.mean(v), 1) for k, v in sorted(out.items())}


def escaped_layers(defects: list[dict]) -> dict[str, int]:
    """For production defects: which test layer should have caught it?"""
    counts: dict[str, int] = {}
    for d in defects:
        if d["found_in"] == "production" and d["escaped_test_layer"]:
            counts[d["escaped_test_layer"]] = counts.get(d["escaped_test_layer"], 0) + 1
    return counts


def compute(data_dir: Path) -> dict:
    deployments = read(data_dir / "deployments.csv")
    incidents = read(data_dir / "incidents.csv")
    defects = read(data_dir / "defects.csv")
    unknown = {d["found_in"] for d in defects} - PRE_RELEASE - {"production"}
    if unknown:
        raise SystemExit(f"defects.csv: unknown found_in values {sorted(unknown)}")
    return {
        "mttd_minutes": round(mttd(incidents), 1),
        "mttr_minutes": round(mttr(incidents), 1),
        "deployment_frequency_per_day": round(deployment_frequency(deployments), 2),
        "lead_time_hours_median": round(lead_time_hours(deployments), 1),
        "change_failure_rate": round(change_failure_rate(deployments), 3),
        "defect_escape_rate": round(defect_escape_rate(defects), 3),
        "mttd_by_detection_source_minutes": detection_by_source(incidents),
        "escaped_defects_by_missing_layer": escaped_layers(defects),
    }


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    result = compute(Path(argv[1]))
    if "--json" in argv:
        print(json.dumps(result, indent=2))
        return 0
    print("Quality & delivery metrics")
    print("-" * 44)
    print(f"MTTD (mean time to detect)      {result['mttd_minutes']:>8} min")
    print(f"MTTR (mean time to resolve)     {result['mttr_minutes']:>8} min")
    print(f"Deployment frequency            {result['deployment_frequency_per_day']:>8} /day")
    print(f"Lead time for changes (median)  {result['lead_time_hours_median']:>8} h")
    print(f"Change failure rate             {result['change_failure_rate']:>8.1%}")
    print(f"Defect escape rate              {result['defect_escape_rate']:>8.1%}")
    print("\nMTTD by detection source (min):")
    for source, value in result["mttd_by_detection_source_minutes"].items():
        print(f"  {source:<20} {value:>6}")
    print("\nProduction defects by the layer that missed them:")
    for layer, count in result["escaped_defects_by_missing_layer"].items():
        print(f"  {layer:<20} {count:>6}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
