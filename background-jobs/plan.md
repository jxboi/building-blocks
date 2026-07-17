# Plan — Background Jobs

## Purpose
Reliable async execution: fire-and-forget jobs, delayed jobs, recurring schedules, and the **transactional outbox** that makes cross-module events durable. Nearly every other platform module (email, digests, retention, purges, indexing, billing sync) runs on this.

## Decisions
- **Hangfire with PostgreSQL storage** — no extra infrastructure (Redis/RabbitMQ) in the starter shell; same DB, transactional-friendly, built-in dashboard, retries, and recurring jobs. Seam note: job enqueue goes through our own `IJobScheduler` wrapper so a future move to Quartz/queue-based workers doesn't touch call sites.
- **Worker topology:** jobs execute **in the API process** by default (simplest deploy); compose/prod can run a dedicated worker container (`--worker` flag toggles: API serves HTTP + enqueues, worker hosts Hangfire server). Both modes always supported.
- **Queues:** `critical` (auth emails, webhooks), `default`, `low` (digests, retention, reindex) — worker processes them with weighted priority.
- **Transactional outbox:** `outbox_message` table written in the same transaction as business changes; Hangfire-driven relay dispatches to domain-event subscribers (audit, notifications, search, billing) with at-least-once delivery; subscribers must be idempotent (idempotency key = message ID). Poison messages → dead-letter status after N retries + alert.
- **Job conventions:** jobs are thin — resolve a handler, pass IDs (never serialized entities), set org context explicitly (no ambient tenant in background), honor cancellation tokens, log with correlation ID inherited from the enqueuing request.
- **Process-manager (saga) pattern — convention, not engine:** long-running multi-step processes (org purge with grace period, export pipelines, billing dunning, member offboarding) follow a documented pattern: a `process_instance` row (type, subject_id, current_step, state JSONB, status, next_wake_at) + a handler class with idempotent step methods; steps advance via jobs/delayed jobs, resume from the persisted step after crashes, and finish with a completion event. A tiny `ProcessRunner` base class (~100 lines) enforces the shape. Deliberately **not** a workflow engine — no dynamic definitions, versioned instance migration, or designer. If a project's orchestration genuinely outgrows this (fan-out/fan-in, weeks-long compensation chains), adopt Temporal or Elsa behind the `IJobScheduler` seam rather than growing this pattern into an engine.
- **Recurring jobs registry:** each module declares its schedules in code (`IRecurringJobRegistry`) — outbox relay sweep, digest flush, retention/purge jobs, orphan-file sweeper, flag staleness report, billing reconciliation. Single startup registration; visible in one place. These are system jobs: code-defined, UTC, no tenant context.
- **User-defined schedules (primitive):** the org-facing counterpart — customers schedule registered actions ("email this report every Monday 9am Singapore time"). One shared mechanism so features never rebuild cron/timezone/ownership handling:
  - **Schedulable-action registry** (standard pattern): action key, params schema, permission required to schedule, executor. Scheduled reports are the reference consumer; product features (scheduled publish, reminders, syncs) register the same way.
  - **`user_schedule` table** (org_id, creator_id, action_key, params JSONB, cron, iana_timezone, paused_at, last_run_at, next_run_at) + a single minutely **dispatcher** recurring job: claims due rows (`next_run_at <= now`, row-locked, multi-instance-safe), enqueues the action as a normal job, computes the next occurrence in the schedule's IANA timezone (DST-safe via Cronos — 9am stays 9am local across transitions).
  - **Rules decided once:** executes under the creator's tenant/permission context; creator leaves org → schedule pauses + org admins notified; **misfire policy = coalesce** (downtime ⇒ one catch-up run, never N backfills); guardrails: minimum interval (5 min), per-org schedule cap, all changes audited; org default timezone in `org_setting`, overridable per schedule.
  - **Frontend:** shared schedule-editor component (cadence presets + timezone picker — raw cron behind an "advanced" toggle) and a schedules list in settings; admin console sees all schedules per org.
  - **Non-goals:** event-triggered automation ("when X then Y" — rejected product vertical, see master plan), sub-5-minute precision, per-run parameter prompts.
- **Idempotency + locking:** `DisableConcurrentExecution` / distinct lock per recurring job; long jobs checkpoint progress.

## Dashboard & ops
Hangfire dashboard mounted at `/admin/jobs` behind `admin.jobs.manage` permission (admin console links to it). Metrics (queue depth, failures, outbox lag) exported per logging-observability plan.

## Data model
Hangfire-managed schema (`hangfire`), plus `outbox_message` (id, occurred_at, type, payload JSONB, status, attempts, locked_until, error) and `user_schedule` (see above) in schema `jobs`.

## Milestones
1. Hangfire + Postgres storage + `IJobScheduler` + queues + worker-mode flag.
2. Outbox table, relay, idempotent-subscriber pattern + tests (crash/redelivery scenarios).
3. Recurring registry + first real schedules.
3a. `ProcessRunner` base + `process_instance` table, proven on the org-purge grace-period flow.
4. Dashboard auth + dead-letter handling + metrics.
5. User-schedule primitive: registry + dispatcher + timezone handling + schedule-editor component, proven on scheduled reports.
