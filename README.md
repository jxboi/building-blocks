# Building Blocks

A production-quality **starter shell for SaaS products**: authentication, multi-tenancy, RBAC, auditing, billing, and two dozen other solved-once concerns — designed to be inherited by future projects as a template repository, extended through registries and seams, never rewritten.

> **Status: planning stage.** This repo currently contains the complete plan set — no application code yet. Every module below has a `plan.md` with locked decisions, data models, API surfaces, extension points, and milestones. Code lands under `apps/` and `infra/` per the build order in the master plan.

## Start here

| File | What it is |
|---|---|
| [master-plan.md](master-plan.md) | The architecture: stack decisions, module index + dependency graph, system diagram, build phases, cross-cutting conventions, security baseline, rejected alternatives |
| [docs/edge-case-catalogue.md](docs/edge-case-catalogue.md) | ~115 hard scenarios with expected behaviours — the acceptance-test source and regression map |
| [docs/stress-test-2026-07-16.md](docs/stress-test-2026-07-16.md) | The original 48-scenario stress review of the plans |

## Stack (locked)

**Next.js** (App Router, TypeScript, Tailwind, shadcn/ui) · **ASP.NET Core** (modular monolith, vertical slices) · **PostgreSQL** (EF Core, schema-per-module) · **Hangfire** (jobs + transactional outbox) · **SignalR** · **Serilog + OpenTelemetry** · **S3/MinIO** · Docker Compose dev environment. One optional Redis unlocks full multi-instance behaviour. Postgres is the only hard runtime dependency — every external service sits behind a provider seam with a local/dev implementation.

## Modules (27)

**Foundation** — [nextjs](nextjs/plan.md) · [dotnet-api](dotnet-api/plan.md) · [postgresql](postgresql/plan.md) · [error-handling](error-handling/plan.md) · [logging-observability](logging-observability/plan.md) · [docker-deployment](docker-deployment/plan.md)

**Identity & access** — [authentication](authentication/plan.md) · [organisations-workspaces](organisations-workspaces/plan.md) (orgs, workspaces, teams, org chart) · [roles-permissions](roles-permissions/plan.md) (RBAC, ACLs, field policies, approvals)

**Platform services** — [background-jobs](background-jobs/plan.md) (outbox, process managers, user schedules) · [email-delivery](email-delivery/plan.md) · [notifications](notifications/plan.md) (+ messages inbox) · [file-uploads](file-uploads/plan.md) (+ image pipeline) · [search](search/plan.md) · [feature-flags](feature-flags/plan.md) (+ feature-access resolver) · [audit-logs](audit-logs/plan.md) · [custom-fields](custom-fields/plan.md) (fields, tags, entity rules)

**Product surface** — [billing-hooks](billing-hooks/plan.md) · [integrations](integrations/plan.md) (outbound webhooks, OAuth vault) · [ai-integration](ai-integration/plan.md) · [reports](reports/plan.md) · [document-templates](document-templates/plan.md) (PDF form filling) · [admin-console](admin-console/plan.md) · [feedback](feedback/plan.md)

**Baseline verticals** (optional, removal-tested) — [tasks](tasks/plan.md) · [queues](queues/plan.md)

**Handoff** — [seed-data-demo](seed-data-demo/plan.md)

## Design philosophy (the short version)

- **Universal behavior seams over universal objects.** Entities stay typed and boring; cross-cutting powers (permissions, search, audit, notifications, ACLs, custom fields) attach through ~15 code registries. Verticals register in; the platform never knows about them.
- **One policy per concern, defined once**: transactions (command = one atomic commit of change + audit + outbox), caching (TTL-bounded ≤60s, tenant-required keys), resilience (Postgres is the only dependency allowed to take the app down), PII (guarded fields never reach logs, exports, indexes, or AI prompts).
- **Admins configure, developers own correctness.** Settings cascade, feature toggles, custom fields, tags, entity rules, and approval policies are frontend-configurable within closed catalogues; arbitrary user-programmed automation, query builders, and workflow designers are deliberately rejected (see master plan → Rejected Alternatives).
- **Everything audited, everything explainable** — `?explain=` answers "why can this user do X"; correlation IDs thread an on-screen error code through logs, traces, and audit entries.

## How future projects consume this

1. Create a new repo from this template; run the rename script.
2. Delete optional modules you don't need (each plan documents removal; the verticals have CI removal tests).
3. Build product features as vertical slices that **register into the seams** — the [tasks](tasks/plan.md) module is the worked example to copy.
4. Pull upstream shell improvements by merging from the template remote (see `docs/upstream.md` once built).

## Roadmap

Build proceeds in the five phases defined in [master-plan.md](master-plan.md#build-order-phases): foundation → identity & tenancy → platform services → product surface → verticals & handoff. Each phase ends green: clean migrations from scratch, `docker compose up`, integration tests passing, demo seed loading.
