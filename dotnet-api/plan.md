# Plan — .NET Core API Shell

## Purpose
The backend host every module plugs into: solution layout, vertical-slice conventions, dependency injection, domain events, OpenAPI, validation, and the module registration pattern that keeps core and product code separated.

## Decisions
- **.NET current LTS**, ASP.NET Core Minimal APIs organised as **vertical slices** (one folder per feature: endpoint + handler + request/response + validator).
- **Modular monolith:** each building block is a project (`Modules.Auth`, `Modules.Tenancy`, …) referencing shared `Kernel` (base types, events, results) — no module references another module's internals; cross-module communication via public contracts project or domain events.
- **MediatR-style in-process messaging** for commands/queries and domain events; transactional outbox (see background-jobs) for side effects that must survive crashes.
- **FluentValidation** on all requests; validation failures → RFC 9457 problem details automatically.
- **OpenAPI** generated at build (`/openapi/v1.json`), source of truth for the frontend typed client.
- **Result pattern** (no exceptions for expected failures); exceptions reserved for bugs/infrastructure.
- **API versioning** path-based `/api/v1`; additive changes preferred over v2. **Client requirements endpoint** (`/api/v1/meta/client-requirements`): min-supported version per client type — the web reads it for the version-skew banner; a future mobile app reads it for the force-upgrade gate (app stores can't hot-deploy, so the API must be able to say "this client is too old" gracefully rather than break it confusingly). Native clients authenticate via the token endpoint with PKCE where an OAuth flow is involved; refresh tokens live in platform keystores — same rotation/grace semantics as the web (authentication plan).

## Structure
```
apps/api/
├── src/
│   ├── Host/                  Program.cs, composition root, middleware pipeline
│   ├── Kernel/                base entity, domain events, Result, guard clauses
│   ├── Kernel.Contracts/      cross-module public DTOs + event contracts
│   └── Modules/
│       ├── Auth/  Tenancy/  Permissions/  Audit/  Notifications/
│       ├── Files/  Search/  Flags/  Jobs/  Email/  Billing/  Admin/
├── tests/
│   ├── UnitTests/             per-module
│   └── IntegrationTests/      Testcontainers Postgres, WebApplicationFactory
└── Directory.Build.props      shared analyzers, nullable enabled, warnings as errors
```

## Middleware pipeline (order matters)
1. Request logging + correlation ID (logging-observability)
2. Exception → ProblemDetails (error-handling)
3. Authentication → 4. Tenant resolution (org/workspace from route/claims) → 5. Authorization policies
6. Rate limiting (built-in ASP.NET limiter, per-user + per-IP buckets)
7. Endpoint execution

## Transactions & atomicity (Kernel)
- **One transaction per command.** A pipeline behavior wraps every command handler: begin → handler mutates aggregates → in-transaction event subscribers run (audit rows) → outbox messages written → single `SaveChanges` → commit. The invariant the whole shell leans on: **business change + audit entry + outbox message commit atomically or not at all.** Queries never open write transactions.
- **Two event lanes, explicit:** *in-transaction* subscribers (audit, cache-eviction markers) share the commit; *post-commit* effects (email, notifications, search indexing, webhooks) go through the outbox exclusively. A handler that needs an external side effect writes an outbox message — never calls the provider inline.
- **No external calls inside a transaction. Ever.** No S3/Stripe/model/email/HTTP inside the DB transaction (connection held hostage by network latency; commit ≠ external success). Pattern: external-first with provisional state (`pending` file rows before presign) or external-after via outbox/process manager. **No distributed transactions** — cross-module consistency is eventual via outbox + idempotent subscribers; the stress-tested reconciliation jobs (billing, orphan files) heal the gaps.
- **Isolation & invariants:** default `ReadCommitted`. Race-sensitive invariants don't get serializable transactions — they get the cheapest correct tool, chosen per invariant: **DB constraints as the final guard** (unique, FK, check — e.g. slug uniqueness), `SELECT … FOR UPDATE` row locks for counter-style invariants (seat counts, storage quota, last-owner check), `xmin` optimistic concurrency for user-editable aggregates (→ 409, per error-handling plan).
- **Transient-failure retries:** Npgsql execution strategy retries transient errors at the *command* level (the whole unit of work re-runs, which is safe because handlers are pure DB work per the rules above) — never partial retries inside a transaction.
- **Multi-step operations** (org purge, export, dunning) are explicitly *not* one big transaction — they're process-manager flows (background-jobs plan): each step atomic, progress persisted, resumable.

## Resilience & fallback (Kernel)
Failure handling is declared per dependency, not improvised per call site.

- **Dependency tiers:**
  - **Postgres is the one hard dependency.** If it's down, the app is down — fail fast with 503 + readiness probe failure (platform stops routing traffic). No pretend-degraded mode; a tenant app without its truth store serving guesses is worse than an honest error page.
  - **Everything else is soft** and declares its outage behaviour:
    | Dependency | On outage |
    |---|---|
    | Email provider | invisible to users — sends queue in jobs, retry with backoff, alert on sustained failure |
    | Object storage | uploads/downloads fail with typed error; rest of app unaffected |
    | Search backend | typed `search-unavailable` → UI keeps nav-only command palette + banner |
    | Billing provider | entitlements keep working (local subscription state is authoritative between syncs); checkout/portal fail gracefully with retry guidance |
    | AI provider | feature-level typed error; per-feature kill switch (flags) for sustained incidents |
    | Redis (if enabled) | caches fall back to L1+TTL; SignalR falls back to polling — degraded, not broken |
- **Timeout budget (explicit at every layer, inner < outer):** client fetch 30s (aborted on unmount/navigation via query cancellation) > server request processing (cancellation token flows through handlers to EF — an abandoned request stops doing work, logged as cancelled not errored) > DB command timeout 30s > outbound provider total timeout (per-client, typically 10–15s). Long work never fights a timeout — anything that can't finish inside the request budget is a background job + notification by design. Job-level: external-heavy jobs set explicit timeouts; nothing waits forever.
- **Outbound HTTP standard pipeline** (`Microsoft.Extensions.Http.Resilience`, applied via named clients — never hand-rolled loops): total-request timeout, retries with jittered backoff **for idempotent calls only**, circuit breaker per provider. Breaker state feeds the health check + a metric (so "Stripe is flapping" is a dashboard fact, not a log-diving exercise). Outbound calls send provider idempotency keys where supported (Stripe et al.).
- **Retry-safety at the API boundary:** PUT/DELETE idempotent by design; POSTs protected by natural keys/unique constraints (duplicate → typed 409, which clients treat as success-already); no generic idempotency-key middleware unless a project needs it (payment-adjacent endpoints being the likely first case).
- **Frontend:** queries auto-retry (bounded, jittered) — mutations never auto-retry (the 409-as-already-done convention makes manual retry safe); **feature-level error boundaries** so one failed widget (usage stats, search) degrades that widget, never the page; 429 honours `Retry-After`; sustained API unreachability shows the global error page with correlation ID.

## Caching policy (Kernel)
One strategy, not per-module improvisation. **Postgres is the source of truth; caches buy latency, never correctness** — every cache has a declared staleness bound and the system is correct (just slower) with caching disabled entirely.

- **One abstraction: `HybridCache`** (.NET) — L1 in-memory always on; **L2 (Redis) config-enabled** for multi-instance deployments (same Redis as the SignalR backplane — one optional dependency, not two). No other cache mechanisms; no memoization stashes in services.
- **Invalidation = TTL is the guarantee, events are the fast path.** Domain events evict local entries immediately on the instance that processed the change; the TTL bounds staleness everywhere else (and across instances when L2 is off). With Redis L2 enabled, eviction propagates cross-instance. Nothing relies on event delivery for correctness.
- **Named cache inventory** (each entry declares key shape, TTL, invalidating events — reviewed like the permission registry):
  | Cache | TTL | Evicted by |
  |---|---|---|
  | permission snapshot (user+org) | 60s | role/assignment/team events |
  | flag snapshot (org) | 30s | flag change events |
  | settings cascade (scope) | 60s | setting change events |
  | entitlements (org) | 60s | subscription events |
  | tenant context (org slug→id, member status) | 60s | membership events |
- **Tenant-safe keys, mechanically:** every cache key is built through one `CacheKey.For(org, …)` helper that *requires* the tenant (and user, for user-specific entries) — a bare-string cache key fails review; this is the guard against the worst cache bug there is (cross-tenant leakage).
- **Never cached:** resource-ACL decisions (they're SQL predicates on the query), field-policy-shaped responses (per-user output), presigned URLs (they carry their own expiry), anything auth-token-derived.
- **HTTP layer:** authenticated API responses are `no-store` by default. Explicit opt-ins only: public endpoints (health, plan catalogue) get short public cache headers; expensive per-org aggregates (dashboard stats endpoints) may opt into output caching via HybridCache with org-scoped keys + ≤60s TTL — declared per endpoint, never blanket.

## Settings registry (Kernel primitive)
Typed, layered runtime settings — the counterpart to env config (env = infrastructure + secrets, needs restart; settings = behaviour, hot, DB-backed):
- **Declared in code:** each module registers its settings — key, type, default, validation, **scope** (`platform` | `org` | `workspace` | `user`), required edit permission, and whether it's exposed to the frontend. Unknown keys fail tests (standard registry rules).
- **Precedence cascade:** platform default → org value → workspace value → user value, for settings that allow the lower scopes (declared per setting). Typed accessor: `ISettings.Get<T>(key)` resolves through the cascade using the current `ITenantContext` — one line at call sites, cached, invalidated by change events.
- **One table** (`kernel.setting`: scope_type, scope_id, key, value JSONB validated against the declared type), one generic settings UI per scope (org settings pages, user preferences, platform settings in admin console) generated from registry metadata — modules never build bespoke settings screens.
- **Every change audited**; platform-scope changes are admin-console-only (`admin.settings.manage`).
- Existing ad-hoc settings converge here: `org_setting` (MFA policy, allowed domains, timezone, branding tokens), notification defaults, retention windows, registration-open, default plan. Baseline **user-scope** settings: theme, locale, timezone override, default workspace, saved views.
- **No team scope, deliberately:** the cascade is platform → org → workspace → user. Teams are people-groupings (principals for access + approval routing), not containers — team-scoped settings would create a shadow workspace concept. A product that truly needs per-team config adds it as product state, not a cascade level.
- **Non-goals:** secrets (env/KMS only — the registry rejects secret-shaped keys), per-request overrides, setting schemas editable at runtime.

## Module registration pattern
Each module exposes `IModule { AddModule(IServiceCollection, IConfiguration); MapEndpoints(IEndpointRouteBuilder); }`, discovered and registered by Host. Inheriting projects drop new module projects in and register them the same way — Host changes are one line.

## Non-goals
Microservices, gRPC, CQRS with separate read stores, event sourcing. The seams exist to add these later if a project truly needs them.

## Milestones
1. Solution + Kernel + Host skeleton, health endpoints (`/health/live`, `/health/ready`).
2. Module registration pattern + sample module with tests.
3. Validation, Result pattern, ProblemDetails wiring.
4. OpenAPI + client generation pipeline.
5. Rate limiting, CORS, security headers baseline.
