# Plan — PostgreSQL

## Purpose
Single source of truth for persistence: database conventions, EF Core setup, migration strategy, and the operational baseline (backups, indexes, connection management) every module inherits.

## Decisions
- **PostgreSQL** (current stable major), one database per environment; **one schema per module** (`auth`, `tenancy`, `audit`, `files`, …) for clear ownership within the monolith.
- **EF Core code-first** with Npgsql; migrations checked in per module, applied by a migration runner on deploy (not on app start in prod; auto-apply allowed in dev).
- **UUIDv7 PKs** (`uuid` column, generated in app code for time-ordering benefits).
- **Naming:** snake_case tables/columns via EF convention plugin; singular table names.
- **Base columns:** `id`, `created_at`, `updated_at` (trigger or SaveChanges interceptor); `organisation_id` on all tenant-owned tables with mandatory composite index `(organisation_id, ...)`.
- **Concurrency:** `xmin` optimistic concurrency on user-editable aggregates.
- **JSONB** allowed for genuinely schemaless payloads (audit metadata, notification payloads, flag rules) — never for core relational data.
- **Connection pooling:** Npgsql pooling defaults; PgBouncer noted as prod option in docker-deployment plan.

## Tenancy enforcement
- EF **global query filters** on `IOrganisationOwned` entities driven by an `ITenantContext` scoped service (set by tenant-resolution middleware).
- Integration test suite that asserts cross-tenant reads return nothing — this is the regression gate for every new entity.
- (Optional hardening, documented not default): Postgres RLS policies mirroring the app filter for defense in depth.

## Extensions used
`pg_trgm` (search), `citext` (emails), `pg_stat_statements` (slow-query visibility — feeds the observability plan's slow-path tooling), `pgcrypto` (if needed). Enabled via an initial migration; documented so managed-Postgres compatibility is checkable.

## Operations baseline
- **Backups:** daily `pg_dump` in dev-tier deployments; point-in-time recovery via provider (RDS/Neon/Cloud SQL) in prod — decision deferred to docker-deployment plan.
- **Migrations discipline:** forward-only, no edits to applied migrations; destructive changes require two-step (expand → contract) releases.
- **Index review:** every new query path in a PR must state its supporting index or why seq scan is fine.

## Milestones
1. Docker Compose Postgres + init scripts (extensions, dev role).
2. EF Core base: conventions, interceptors, `ITenantContext`, base entity.
3. Migration runner project + CI check (migrations apply from scratch).
4. Testcontainers integration-test harness shared by all modules.
