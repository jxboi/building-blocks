# Plan — Audit Logs

## Purpose
Immutable, queryable record of who did what, when, to which resource, in which org/workspace. Serves compliance, customer-facing activity feeds, and internal debugging.

## Decisions
- **Event-driven capture:** audit entries are written by a single subscriber listening to domain events (`IAuditable` events carry actor, action, target, metadata). Modules never write audit rows directly — they publish events. This keeps capture consistent and gives inheriting projects auditing for free when they publish events.
- **Write path:** same transaction as the business change where the event is in-process (guarantees no audited-action-without-log); outbox-relayed events append asynchronously with at-least-once + idempotency key.
- **Append-only:** no update/delete endpoints; DB role for the app has no UPDATE/DELETE on the table; corrections are new entries.
- **Shape:** `actor` (user_id | api_key_id | system), `action` (verb string matching permission naming, e.g. `member.role_changed`), `target_type` + `target_id` + `target_label` (denormalised display name — survives target deletion), `organisation_id`, `workspace_id?`, `metadata` JSONB (before/after diff for sensitive changes, capped size), `ip`, `user_agent`, `correlation_id`, `created_at`.
- **Retention:** partitioned by month (native Postgres partitioning); retention window configurable per deployment (default 400 days); drop-partition job in background-jobs. Export-before-drop hook for compliance-heavy projects.
- **Module facet:** every entry carries `module` (auth, tenancy, files, billing, …), stamped at write time from the event registry — subsystem filtering is a column filter, never action-string parsing. Inheriting projects' events carry their module the same way.
- **Visibility tiers (three, on every entry):** `member` (ordinary collaboration activity — renames, shares, uploads), `admin` (governance — role changes, policy edits, invitations, billing), `internal` (security/platform — login failures, token reuse, impersonation, admin-console actions). Tier assigned by the event registration, not by writers ad hoc.
- **Viewing levels (each = same table, narrower filter + permission):**
  | View | Who | Sees |
  |---|---|---|
  | Workspace activity feed | workspace members | `member`-tier, that workspace |
  | Team activity feed | that team's leads (contextual; org toggle) | `member`-tier, actions by team members |
  | Org activity feed | org members | `member`-tier, org-wide |
  | Org audit log | `audit.read` (org admins) | `member` + `admin` tiers, all filters |
  | Entity history ("Activity" tab on a file/member/role) | whoever can view the entity | its `member`+`admin` entries via `(target_type, target_id)` |
  | Actor timeline | `audit.read` | everything one actor did in the org |
  | Platform audit | `admin.audit.read` | all tiers, cross-org, incl. `internal` |
- **PII discipline:** metadata scrubber runs before persist (drops password/token/secret-shaped keys); documented allowlist per event type.

## Audit-grade guarantees (what a real audit engagement asks for)
- **Tamper-evidence:** append-only DB grants are the first line; on top, a daily **integrity anchor** job computes a running hash chain per org per day (each day's hash incorporates the previous anchor) and stores anchors separately (object storage, versioned). Exports include the relevant anchors so an auditor can verify a produced extract matches what the system recorded. Cheap (one job), on by default; external timestamping (RFC 3161) is a documented upgrade for regulated deployments.
- **Completeness (provable, not asserted):** an **audit-coverage architecture test** — every state-changing command must publish an `IAuditable` event or carry an explicit `[AuditExempt(reason)]` annotation; the exemption list is generated into the docs and reviewed. "Is everything privileged captured?" becomes a CI-enforced yes plus a short, justified exception list.
- **Legal hold:** a per-org hold flag (platform admin, audited, reason required) suspends *all* retention purges for that org — audit partitions, email logs, messages, files, soft-deleted data — until released. Purge jobs check the flag; holds are visible in the admin console.
- **Auditor access pattern (no new mechanism — documented recipe):** a custom role bundling `audit.read` + read-only permissions, granted as a **time-boxed assignment** (`expires_at`) — external auditors get scoped, auto-expiring, fully-logged access; their own reads of the admin surfaces are themselves audited.
- **SIEM/archival seam:** audit entries are exportable continuously via a registered outbox subscriber (`IAuditForwarder`, off by default) → org's SIEM/WORM store; the reports pipeline covers ad-hoc extracts.

## Data model (schema `audit`)
`audit_log` (partitioned, now incl. `module` + 3-tier `visibility`), indexes: `(organisation_id, created_at desc)`, `(organisation_id, workspace_id, created_at desc)`, `(target_type, target_id)`, `(actor_id, created_at desc)`, `(correlation_id)`. Module/action filters ride the org index (low cardinality); GIN on metadata only if a project needs it (off by default).

## Endpoints (`/api/v1`)
audit-logs (org-scoped list: filter by actor / action / module / target / workspace / visibility tier / date / correlation_id, cursor pagination) — the correlation_id filter turns a user-reported error code into the full trail of what that request did. Scoped views above are the same endpoint with enforced filter floors (a workspace member *cannot* widen past their view). Export is a registered report type on the reports pipeline (`reports/` plan) — no bespoke export endpoint here.

## Frontend
Built on the filter kit (nextjs plan): audit log page with faceted filters + saved views (e.g. "billing changes this quarter", "everything Sam did"); a shared **`ActivityFeed` component** renders any of the scoped views (workspace feed, entity Activity tab, actor timeline) from the same endpoint — one component, six surfaces.

## What gets audited (baseline registry)
All auth security events, all membership/role/invite changes, org/workspace lifecycle, file delete, flag changes, billing changes, admin console actions. Registry documented in module README; inheriting projects append.

## Milestones
1. Event contract (`IAuditable`), subscriber, table + partitioning.
2. Query endpoints + org Activity feed UI.
3. Retention job + export.
4. Scrubber + per-event visibility flags.
