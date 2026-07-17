# Plan — Logging & Observability

## Purpose
Know what the system is doing in every environment: structured logs, distributed traces, metrics, health checks, and dashboards — with a local stack in Docker Compose so observability isn't a prod-only afterthought.

## Decisions
- **Serilog** for structured logging (JSON to stdout — 12-factor; the platform ships logs). Enrichers: correlation ID, user ID, org ID, module, version, environment. Request logging middleware with sensible noise reduction (health checks excluded, bodies never logged).
- **OpenTelemetry** for traces + metrics, OTLP exporter. Auto-instrumentation: ASP.NET Core, HttpClient, Npgsql/EF, Hangfire (custom activity source), SignalR. Frontend: Next.js instrumentation hook reporting route timings + web vitals through the BFF.
- **Local observability stack (compose profile `observability`):** Grafana + Loki (logs) + Tempo (traces) + Prometheus (metrics) — or the all-in-one Grafana LGTM container to keep it light. Optional; core dev loop works without it.
- **Prod backend is a seam, not a decision:** anything OTLP-compatible (Grafana Cloud, Datadog, Honeycomb, Axiom). Config-only switch.
- **Error tracking:** Sentry SDK wired in API + web behind config flag (fills the `reportError()` seam from error-handling); source maps uploaded in CI when enabled.
- **Log discipline:** levels defined (Debug=dev noise, Info=business events, Warning=degraded-but-handled, Error=needs human attention); message templates with named properties (never string interpolation); PII policy — no emails/tokens/payloads in logs, user referenced by ID only; sampling for high-volume traces (head sampling 10% prod default, 100% dev/errors).

## Health & readiness
- `/health/live` (process up) and `/health/ready` (Postgres, storage, Hangfire, email provider — each as tagged health check contributed by its module). Compose/K8s/platform probes point at these.
- Health checks surfaced in admin console status page.

## Metrics baseline
HTTP rate/latency/errors by endpoint, DB query duration, Hangfire queue depth + job failures, outbox lag, SignalR connections, auth failures, per-org request counts (top-N, for abuse spotting). Dashboards checked into `infra/grafana/` as JSON.

## Slow-path visibility (finding "why is it slow")
- **Slow-request logging:** requests over a threshold (default 3s, settings registry) log a Warning with route, org, duration, and DB-time share — greppable and alertable without tracing tooling.
- **Slow-query capture:** EF command interceptor warns on queries over threshold (default 500ms) with the calling feature; `pg_stat_statements` enabled (postgresql plan) so "top queries by total/mean time" is one admin query away.
- **Frontend:** web vitals (LCP/INP/CLS) reported per route through the BFF into metrics; a route whose p75 LCP degrades shows up on the dashboard like any backend regression.
- Traces tie the three together: a slow page → its API span → its SQL span, via the correlation ID on every log line.

## Usage & performance rollups (in-app history, no external stack required)
A nightly job aggregates the day's request logs and job stats into two small tables (schema `ops`, 400-day retention):
- **`daily_endpoint_stats`** — per endpoint: count, error count, p50/p95 duration, DB-time share. Answers "is this endpoint degrading?" as a trend, not a snapshot.
- **`daily_org_usage`** — per org: request count, distinct active users, job executions, storage delta, AI tokens. Answers "whose usage changed?" and gives DAU/WAU per org without a product-analytics platform.
These power the admin console's trend charts (dashboard kit) and are exportable (CSV via platform-scoped report types) — so a system admin can *pull* the data, not just view it. The rollups are deliberately coarse (daily, no per-user behaviour tracking); fine-grained analysis belongs to the OTel backend when wired.

**Product analytics is a seam, not a feature:** the frontend ships an `IAnalytics` no-op hook (`track(event)`) with PostHog/Plausible as documented drop-ins — feature-adoption funnels and session analytics are a product decision with privacy implications (consent, DPA), so the shell provides the seam and the org-level basics above, nothing more.

## Alerting — how admins find out (two tiers)
- **Tier 1 — shell-native watchdog (always on, zero external dependencies):** a recurring job evaluates internal health signals every few minutes — readiness-check failures, outbox lag, dead-letter count, job failure rate, email failure streak, circuit breakers stuck open, disk/storage headroom — against thresholds in the settings registry, and notifies **platform admins** via the notification pipeline (in-app + email), deduped and throttled (one alert per condition per window, plus a recovery notice). The app tells its operators its plumbing is backing up even on the smallest single-VM deploy. Watchdog state is the admin console dashboard's health strip.
- **Tier 2 — observability-stack alerting (when the OTel backend is wired):** alert rules as code (error-rate spike, p95 latency over target, DB connection saturation, queue depth) → the backend's contact points (email/Slack/PagerDuty). Baseline targets documented as the SLO starting point: API p95 < 300ms, error rate < 0.5%, outbox lag < 60s, job queue drain < 5min — inheriting projects tune, not invent.
- The two tiers overlap deliberately: tier 1 catches "the plumbing is sick," tier 2 catches "the experience is degrading." Losing the external stack never means losing all alerting.

## Milestones
1. Serilog + correlation enrichment + request logging.
2. OTel traces/metrics + OTLP export + compose observability profile.
3. Health checks per module + dashboards.
4. Sentry seam + frontend vitals + alert rule docs.
