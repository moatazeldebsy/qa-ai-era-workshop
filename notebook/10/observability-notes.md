# Production quality and observability notes

Topic 10. Reference answer.

## Step 1 — What can the telemetry answer?

| Question an on-call engineer asks | Can the shop's logs and metrics answer it today? How? |
|---|---|
| How many orders failed in the last hour? | Partly: `http_requests_total{route="/api/orders",status="402"}` etc. count them since the process started; Prometheus would turn that into a rate per hour |
| Which customer's order failed, and why? | Only roughly: the log line has the request id, status and timing, but not the reason; the order itself is in memory |
| Is the shop slower than yesterday? | No: there's no latency metric at all, and the log's `ms` field would have to be aggregated by hand |
| Did the inventory service see this failed order? | No: the inventory service logs nothing, and wouldn't know the shop's request id |

## Step 2 — Correlation

How the request id now travels, and what I'd still need for full distributed tracing: the shop's middleware puts the id in an AsyncLocalStorage context; the inventory client reads it and sends `x-request-id`; the inventory service echoes and logs it. For tracing I'd still need spans (start and end times per operation), parent–child relationships, the standard `traceparent` header, sampling, and somewhere to store and view traces: OpenTelemetry provides all of it.

## Step 3 — Liveness and readiness

Why /health stayed green during the outage, and what the load balancer should look at instead: /health only proves the Node process answers HTTP. The load balancer should route by /ready, which asks the inventory service and answers 503 when orders can't be placed.

Why a readiness check must not hang, and must not go red for every small dependency: a hanging check times out the platform's own probe and makes instances flap; and if readiness depends on optional things (recommendations, the AI assistant), a small outage removes every instance from service, which turns a degraded shop into a dead one.

## Step 4 — SLOs and error budgets

My latency and availability SLIs, and how much error budget is left: after 300 warm-up requests, availability 100% (objective 99.5%) and latency 100% under 250 ms (objective 99%), so all of both budgets is left. With 30 recommendations calls at 400 ms mixed into 330 requests, the latency SLI dropped to 90.9%: the budget was exhausted (909% used) while availability stayed at 100%.

If the latency budget were exhausted halfway through the month, what should the team do? Follow the agreed error-budget policy: pause risky releases and feature work on that service, put the slow endpoint first (timeouts, caching, the slow dependency), and resume normal releases once the SLI is back within the objective over the window.

## Step 5 — Synthetic monitoring

What the synthetic journey caught that /health didn't: with the inventory service down, /health said 200 while the journey failed at "an order can be placed and cancelled", the step customers care about.

How I'd keep synthetic orders out of the sales report (Topic 7): the journey uses `monitor@synthetic.example` and an `x-synthetic: true` header; the report should exclude orders from the `synthetic.example` domain (with a test), and the shop could also tag orders created by synthetic requests.
