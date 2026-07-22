# Build Order & Closure Criteria

Derived from [master-plan.md](../master-plan.md) and each module's `plan.md`. This is the sequencing companion: what to build in what order, and the **closure criteria** — the checks that must be green before starting the next module. Nothing here overrides a module's own plan; when in doubt, the plan wins.

## Universal closure criteria (every module, from the master plan's Definition of Done)

A module is not closed until **all** of these hold:

- [ ] `plan.md` decisions reflected in code with **no undocumented deviations** (deviations get an ADR).
- [ ] Migrations idempotent **from an empty database** (CI check, not a manual run).
- [ ] Unit + integration tests written and **wired into CI**.
- [ ] Seed data updated if the module owns entities.
- [ ] Admin console surface added if the module is operator-facing (stub acceptable pre-Phase 4; tracked as debt).
- [ ] README section: how to **configure, extend, and remove** the module.

## Phase-end gates (checked at the end of every phase)

- [ ] Migrations apply cleanly from scratch.
- [ ] `docker compose up` green.
- [ ] Integration tests passing.
- [ ] Demo seed loads (from Phase 2: system seeders; full profiles from Phase 5).

---

## Phase 1 — Foundation

Recommended order within the phase: **1 → 2 → 3 → (4, 5 in parallel) → 6**. nextjs (6 below as listed order, but it has zero deps) can start any time in parallel — it's the look-and-feel track.

### 1. dotnet-api (API shell + Kernel)
**Build:** solution + Kernel + host skeleton → module registration pattern → validation/Result/ProblemDetails → OpenAPI + client generation → rate limiting, CORS, security headers.

**Closed when:**
- [ ] `/health/live` and `/health/ready` respond.
- [ ] A **sample module** registers via the module pattern and its tests pass — this proves the pattern every later module copies.
- [ ] Result pattern → ProblemDetails (RFC 9457) mapping works end-to-end.
- [ ] OpenAPI spec generates and the **typed-client pipeline runs in CI** (nextjs milestone 3 depends on it).
- [ ] Security headers baseline verified.

### 2. postgresql
**Build:** compose Postgres + init scripts → EF conventions/interceptors/`ITenantContext` base entity → migration runner + CI check → Testcontainers harness.

**Closed when:**
- [ ] Migration runner applies from an empty DB **in CI** (this check is the backbone of every later phase gate).
- [ ] Base-entity conventions in place: UUIDv7 keys, UTC `created_at`/`updated_at`.
- [ ] **Testcontainers integration-test harness works** — every subsequent module's integration tests depend on it; do not proceed with a flaky harness.
- [ ] `ITenantContext` seam exists (implementation lands with organisations-workspaces in Phase 2 — the query-filter wiring is deliberately split).

### 3. error-handling
**Build:** ProblemDetails middleware + error catalogue → frontend fetch wrapper/ApiError → route boundaries + 401/403/429 flows → correlation ID.

**Closed when:**
- [ ] **Correlation ID end-to-end test passes:** trigger an error in the UI, find the log line by the displayed ID. This is the module's own final milestone and the single best smoke test of the whole foundation.
- [ ] Frontend form/toast error conventions established (everything in Phase 2+ uses them).

### 4. logging-observability
**Build:** Serilog + correlation enrichment → OTel traces/metrics + OTLP export + compose observability profile → per-module health checks → Sentry seam + frontend vitals.

**Closed when:**
- [ ] Structured request logging with correlation IDs (pairs with error-handling's end-to-end test).
- [ ] OTel export works against the compose observability profile.
- [ ] Health-check pattern defined so later modules can register theirs.
- [ ] PII discipline holds: user-by-ID only, no emails/PII in logs.

### 5. nextjs (frontend shell)
**Build:** scaffold + tokens + `/design` route + lint rules **from day one** → BFF auth proxy → typed client in CI → org/workspace shell → nav registry → shared kits → command palette → responsive/a11y pass → dashboard kit.

**Closed when:**
- [ ] Token architecture (primitive → semantic) with light/dark, and the **`/design` catalogue route** rendering tokens + kit components in all states, both themes, mobile width.
- [ ] Design-system lint rules active (raw `<img>`/`<button>`/hex/off-scale values fail lint) — the plan calls retrofitting "the expensive path"; do not defer this.
- [ ] Typed API client generated from OpenAPI **in CI**.
- [ ] Nav registry works — later modules register pages instead of editing the sidebar.
- [ ] CSP/security headers verified by a Playwright check.
- [ ] Playwright axe baseline + mobile-width checks green.
- Note: BFF auth proxy (milestone 2) can only be *fully* verified after authentication lands in Phase 2 — build the seam now, close the loop then.

### 6. docker-deployment (dev compose only)
**Build:** compose dev stack + `.env.example` + task runner. **Production Dockerfiles, CI/CD, runbooks stay in Phase 5.**

**Closed when:**
- [ ] `docker compose up` brings up Postgres, MinIO, Mailpit, API, Web — the full stack runs offline.
- [ ] `.env.example` exhaustive, with the CI drift check active.

---

## Phase 2 — Identity & Tenancy

**Sequencing is strict here** (the master plan calls it out): background-jobs (outbox core) and email-delivery **before** authentication — auth's verify/reset flows depend on them. Also: seed-data's **system seeders (milestone 1) are needed from this phase onward**, even though the module proper is Phase 5.

### 7. background-jobs — milestones 1–3 only
**Build:** Hangfire + Postgres storage + `IJobScheduler` + worker-mode flag → **outbox table, relay, idempotent-subscriber pattern** → recurring registry. (Process managers, user schedules, dashboard = Phase 3.)

**Closed (for this phase) when:**
- [ ] Outbox relay proven with **crash/redelivery tests** — the outbox is the primary extension seam of the whole architecture; do not proceed on a happy-path-only outbox.
- [ ] Idempotent-subscriber pattern documented and tested (every Phase 3+ consumer copies it).

### 8. email-delivery — milestones 1–3 only
**Build:** abstraction + SMTP/Mailpit + Razor templates → async sending via jobs + `email_log` + dedupe → auth/invite templates. (Prod providers + suppression = Phase 4-ish, before first real deployment.)

**Closed (for this phase) when:**
- [ ] Emails send async via the job system and land in Mailpit.
- [ ] Auth + invite templates exist — **this explicitly unblocks authentication milestone 2**.

### 9. authentication
**Build:** register/login/refresh/logout with rotation → email verify + password reset → session listing/revocation → TOTP MFA + recovery codes → API keys.

**Closed when:**
- [ ] Refresh rotation with **family revocation + reuse-detection test** passing (named test in the plan).
- [ ] Verify/reset flows work end-to-end through Mailpit.
- [ ] BFF cookie session loop closes: browser never sees raw JWTs (finishes nextjs milestone 2).
- [ ] Auth rate limits + no-user-enumeration verified.
- [ ] Argon2id hashing; TOTP secrets encrypted at the application layer.

### 10. organisations-workspaces
**Build:** org + membership + tenant-resolution middleware + `ITenantContext` → workspaces + switcher → invitations end-to-end → teams → org chart → lifecycle (soft delete, restore, purge, ownership transfer).

**Closed when:**
- [ ] EF global query filters wired off `ITenantContext` (completes the postgresql seam).
- [ ] **Cross-tenant regression test green — this is a permanent CI gate from here forward**, the single most important closure criterion in the repo.
- [ ] Invitations work end-to-end (email → accept → membership).
- [ ] Org purge runs through the grace-period process-manager pattern (coordinate with background-jobs 3a if pulled forward, or stub until Phase 3).

### 11. roles-permissions — approvals last
**Build:** permission registry + policy infrastructure + **architecture test** → system roles + evaluation + explain endpoint → teams as principals + custom roles → workspace-scoped assignments → resource ACLs → temporary grants → field policies → approvals (single-step, then multi-step).

**Closed when:**
- [ ] Architecture test enforcing server-side policy checks passes.
- [ ] `?explain=` endpoint traces a permission decision through all four layers.
- [ ] Field policies shape one reference field (member profile PII) through response, write guard, and the OpenAPI/TS contract.
- [ ] Approvals: **single-step lifecycle done is enough to close Phase 2**; approvals consume notification *stubs* until Phase 3 (per master plan) — multi-step/quorum/escalation can trail into Phase 3.

---

## Phase 3 — Platform Services

Order within the phase is flexible; suggested: audit-logs → notifications → file-uploads → feature-flags → background-jobs remainder. All of these are outbox consumers — each one revalidates the Phase 2 outbox work.

### 12. audit-logs
**Closed when:** `IAuditable` contract + subscriber + partitioned table live; org Activity feed queryable; retention job runs; **scrubber keeps PII out of audit metadata**; audit writes are in the same transaction as the business change (atomicity convention).

### 13. notifications
**Closed when:** registry + fan-out pipeline works; SignalR bell delivers in-app realtime; **preferences are enforced in dispatchers** (not just stored); email digests ride background jobs; approvals' notification stubs from Phase 2 are replaced with the real thing.

### 14. file-uploads
**Closed when:** presign → direct PUT → confirm flow tested against MinIO; purpose registry validates (magic-byte check, EXIF strip); avatar pipeline works; quotas tracked; orphan/purge lifecycle jobs run; scanner seam + quarantine states exist. Files are **presigned-URL-only** — no streaming through the API.

### 15. feature-flags
**Closed when:** evaluation engine + cache + **typed registry** live; `/flags` endpoint + web SSR integration works; `useFeature` resolves flag ∧ entitlement ∧ org toggle ∧ permission; staleness report exists. (Admin management UI = thin surface, lands properly with admin-console in Phase 4.)

### 16. background-jobs — remainder (milestones 3a–5)
**Closed when:** `ProcessRunner` + `process_instance` proven on the **org-purge grace-period flow**; dashboard auth + dead-letter handling + metrics live; user-schedule primitive proven on scheduled reports (or deferred to land with reports in Phase 4 — pick one and record it).

---

## Phase 4 — Product Surface

Hard ordering constraint: **custom-fields before the verticals that host it** (tasks/queues are Phase 5). admin-console late in the phase — it's thin UI over everyone else's endpoints. Suggested order: search → billing-hooks → reports → integrations → ai-integration → document-templates → custom-fields → admin-console → feedback.

### 17. search
**Closed when:** Postgres FTS backend behind the interface; **indexing rides the outbox** (event-driven + reindex command); command palette shows results; **visibility post-filter pattern documented** — search must never leak rows the caller can't see (pairs with the cross-tenant gate).

### 18. billing-hooks
**Closed when:** `IBillingProvider` + **Null provider** (stack runs fully without Stripe); Stripe reference flow (checkout, portal, webhook translator) with **idempotent webhook processing**; entitlement enforcement points live (seats/storage/workspaces) with upgrade UX; reconciliation job + dunning notifications wired.

### 19. reports
**Closed when:** registry + `report_run` pipeline streams CSV with members-list as reference; artifacts are private files with presigned download + retention; **audit export and GDPR export migrated onto the pipeline** (no parallel export paths); schedules respect the pause-on-departure rule; caps/cancellation/progress guardrails in place.

### 20. integrations
**Closed when:** signed outbound webhooks with retries + auto-disable; delivery log + redeliver; **SSRF guard tests pass** (named in the plan); OAuth vault stores tokens application-layer encrypted; Slack reference channel proves `IConnections`.

### 21. ai-integration
**Closed when:** `IAiGateway` + one real adapter + **fake provider** (offline dev works); org opt-out enforced; metering + entitlements live; SSE streaming proven by one reference feature end-to-end; **model output treated as untrusted input; prompt content unlogged**.

### 22. document-templates
**Closed when:** AcroForm upload → mapping → generation → flatten works; overlay designer stamps correctly; data-source registry builds the generate form; async/batch generation + history; **JS-stripping hardening** done.

### 23. custom-fields (blocks Phase 5 verticals)
**Closed when:** host registration + JSONB definitions render in form/table/filter kits; derived fields recompute + backfill; tags + facets work; **entity rules: SQL-compiled sweep, dry-run builder, audit + auto-disable**; visibility shaping respected in exports/reports/search. The rules `enqueue` action is contributed *by queues later* — don't build it here.

### 24. admin-console
**Closed when:** platform roles + admin auth guard + audit wiring; users/orgs surfaces (read, then actions); **impersonation with guardrails** (banner never dismissible, fully audited); flags/email/jobs/billing surfaces wired. Sweep the "admin surface" debt from Phases 2–3 modules here.

### 25. feedback
**Closed when:** submit + context capture + admin inbox; response/notification loop; rate caps; `IFeedbackSink` reference (GitHub/Linear) works.

---

## Phase 5 — Polish & Handoff

### 26. seed-data-demo (full)
**Closed when:** fixture engine + `minimal` profile adopted by the test harness; `standard` profile covers **all module states**; `demo` profile + demo-mode restrictions + nightly reset run.

### 27. tasks (baseline vertical)
### 28. queues (baseline vertical)
**Closed when:** every seam is proven end-to-end — registries (permissions, search, notifications, custom-fields, reports, dashboard tiles), ACLs, approvals example, webhooks, AI reference feature. Queues contributes the `enqueue` rule action into custom-fields. **Closure gate for both: the CI removal test passes** — delete the vertical, everything still builds and runs green. This test is the proof the whole shell is actually inheritance-friendly; treat it as the repo's final exam.

### 29. docker-deployment (prod) + docs
**Closed when:** production Dockerfiles (non-root, distroless) + migrator + healthchecks; CI PR pipeline + main pipeline + staging deploy; gitleaks/CodeQL/Trivy blocking; runbook inventory exists (break-glass, data-masking, storage-migration, secret-rotation, restore); **rename script works** (create a repo from the template and rename it as the test); `docs generate` registry dumps wired with the CI drift check; ADRs seeded from Rejected Alternatives; template-repo checklist done.

---

## The recurring gates (watch these at every module boundary)

1. **Cross-tenant regression test** — permanent CI gate from Phase 2 on. Any module touching tenant data re-proves it.
2. **Migrations from empty DB in CI** — never close a module on a DB that was migrated incrementally on someone's machine.
3. **Outbox crash/redelivery semantics** — every new outbox consumer (audit, notifications, search, integrations) uses the idempotent-subscriber pattern, not a bespoke handler.
4. **`.env.example` + generated-docs drift checks** — CI fails on uncommitted drift; keep them green per module, not in a Phase 5 sweep.
5. **One transaction per command** — business change + audit + outbox commit atomically; no external calls inside transactions.
6. **PII discipline** — shaped DTOs only: logs, audit metadata, search indexes, exports, AI prompts. Check all five points whenever a module touches personal data.
7. **Registry over edit** — a new module registers (nav, permissions, settings, notification types, seeders, admin sections); if closing a module required editing a core file, the seam is wrong — fix the seam before moving on.
8. **Undocumented deviation = not done** — plan divergence needs an ADR in the same PR.
