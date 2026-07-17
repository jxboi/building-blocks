# Plan — Reports Generation

## Purpose
One async pipeline for producing downloadable artifacts from application data: on-demand exports (CSV/XLSX/PDF), scheduled recurring reports, and the GDPR/audit exports other modules already promised. Inheriting projects add report *types*; the pipeline, permissions, delivery, and retention are solved once.

## What this module is not
Not a BI tool, not a query builder, not dashboards. Users pick a registered report and set parameters — they never define data sources or write filters beyond what a report type exposes. (See master plan → Rejected Alternatives.)

## Decisions
- **Report registry** (standard pattern): each report type is declared in code — key (`members.list`, `audit.trail`, `storage.usage`, product-defined ones), parameter schema (zod/FluentValidation-mirrored), supported formats, required permission, and a **data provider** returning a streamed row source. Unknown keys fail tests.
- **Async always:** `POST /reports` creates a `report_run` (queued → running → completed | failed), executes on the `low` queue, streams rows to the renderer (bounded memory — no materialising full datasets), stores the artifact via file-uploads (`export` purpose, requester-private ACL), emits `ReportCompleted` → notification with download link. Runs are cancellable; progress (rows emitted) surfaced for long runs.
- **Security is inherited, not reimplemented:** generation executes under the **requester's** tenant context and permission snapshot — tenancy filters, resource ACLs, and field policies shape the data exactly as the equivalent list endpoint would (stress-test rule #22). A report can never widen access.
- **Renderers behind `IReportRenderer`:** CSV (native streaming), XLSX (ClosedXML), PDF via a seam with QuestPDF as the reference implementation (license gate noted: community license below revenue threshold — swap candidate documented). Renderers are format-only; they never touch authorization.
- **Scheduled reports:** implemented as the reference consumer of the **user-schedule primitive** (background-jobs plan) — report generation registers as a schedulable action; cadence, timezone/DST, pause-on-departure, misfire coalescing, and guardrails all come from the primitive. Each firing creates a normal `report_run`; recipients are org members only. Delivery = email with a **login-gated link**, never attachments (size, leakage, suppression-list interplay all avoided).
- **Retention:** artifacts auto-delete after a configurable window (default 30 days) via the existing file-purge job; `report_run` rows kept 90 days for the history UI.
- **Existing exports converge here:** audit-logs export and auth `me/export` (GDPR) become registered report types instead of bespoke endpoints — one pipeline, one history UI, one retention policy.
- **Filtered-view export (generic, the self-service workhorse):** any list built on the filter kit gets an **"Export view"** action for free — the current facets (incl. custom fields and tags), sort, and column selection are handed to a generic list-export report type that re-runs the same query server-side through the same permission/shaping path. "All customers assigned to me, tagged X, created this quarter" → CSV, without anyone registering a bespoke report. Saved views make these repeatable; the user-schedule primitive makes them recurring ("email me this view every Monday").
- **Parameter conventions for self-service:** report params support `me`-scoped defaults (assignee = requester), date-range presets, and **aggregate-threshold params** (e.g. `min_activity_count` over the period) — aggregates are computed *inside the registered data provider's query*, which is the sanctioned home for cross-entity aggregation (filter facets and entity rules deliberately can't aggregate). A vertical that wants a threshold filterable/rule-able *live* maintains a materialised stat column (e.g. `activity_count_90d`, event-updated) — product code, documented pattern.
- **Rate/size guardrails:** per-org concurrent-run cap and row cap per report type (registry-declared); over-cap → typed 429/validation error with guidance, not a hung queue.

## Data model (schema `reports`)
`report_run` (org_id, requester_id, report_key, params JSONB, format, status, row_count, file_id?, error, requested_at, completed_at). Schedules live in the shared `jobs.user_schedule` table (background-jobs plan) — no reports-owned schedule table.

## Endpoints (`/api/v1`)
reports (list registered types + param schemas for the caller's permissions), reports/runs (create, list history, get status, cancel), reports/runs/{id}/download (presigned via file-uploads), reports/schedules (thin wrappers over the user-schedule primitive, filtered to report actions — `reports.schedule` permission).

## Frontend
Generic "Export…" button component (type + params form generated from schema, format picker), run-history page with statuses and downloads, schedules management in settings. Long-running runs use the notification bell, not a blocking spinner.

## Baseline report types
members list, audit trail (filtered), storage usage by workspace, my-data export (GDPR). Billing invoices explicitly excluded — provider-hosted.

## Removal notes
Optional module: audit export and GDPR export must fall back to their original bespoke-endpoint implementations if removed — practical answer: keep this module, it's the cheaper path.

## Milestones
1. Registry + `report_run` pipeline + CSV streaming + history endpoints, with members-list as reference.
2. File-uploads integration (private artifact, presigned download, retention) + notifications.
3. Migrate audit export + GDPR export onto the pipeline; XLSX renderer.
4. Schedules (creation, pause-on-departure rule, email delivery).
5. PDF renderer seam + guardrails (caps, cancellation, progress).
