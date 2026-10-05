# Production quality and observability notes

Topic 10. Replace every ✏️.

## Step 1 — What can the telemetry answer?

| Question an on-call engineer asks | Can the shop's logs and metrics answer it today? How? |
|---|---|
| How many orders failed in the last hour? | ✏️ |
| Which customer's order failed, and why? | ✏️ |
| Is the shop slower than yesterday? | ✏️ |
| Did the inventory service see this failed order? | ✏️ |

## Step 2 — Correlation

How the request id now travels, and what I'd still need for full distributed tracing: ✏️

## Step 3 — Liveness and readiness

Why /health stayed green during the outage, and what the load balancer should look at instead: ✏️

Why a readiness check must not hang, and must not go red for every small dependency: ✏️

## Step 4 — SLOs and error budgets

My latency and availability SLIs, and how much error budget is left: ✏️

If the latency budget were exhausted halfway through the month, what should the team do? ✏️

## Step 5 — Synthetic monitoring

What the synthetic journey caught that /health didn't: ✏️

How I'd keep synthetic orders out of the sales report (Topic 7): ✏️
