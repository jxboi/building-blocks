# Plan — Admin Console

## Purpose
The operator's cockpit: a platform-level (cross-tenant) admin area for support, moderation, configuration, and system health — cleanly separated from the customer-facing app so inheriting projects get internal tooling for free.

## Decisions
- **Same Next.js app, separate route group `(admin)`** at `/admin` — separate layout/nav, no shared tenant context with `(app)`. Same API host, endpoints under `/api/v1/admin/*`.
- **Access model:** platform roles are **distinct from org RBAC** — a `platform_role` on the user (`support`, `admin`, `super_admin`) with its own permission registry (`admin.users.read`, `admin.orgs.impersonate`, `admin.flags.manage`, …). No customer-facing role grants any admin permission. Admin endpoints additionally require MFA-verified session; every admin action is audited with `visibility=internal`.
- **Platform-role governance:** only `super_admin` grants/revokes platform roles (audited, with reason); the **last active `super_admin` cannot be demoted, deactivated, or deleted** (mirror of the last-owner rule); the first `super_admin` is created by the seeder/CLI, never via the UI. Platform role→permission bundles are **code-defined** (seeded like system roles, no runtime editor — deliberately: three tiers cover operator needs, and an editable platform-role builder is complexity without a customer). Inheriting projects adjust bundles in code.
- **Impersonation (support's power tool):** time-boxed (e.g. 30 min) impersonation session issued by `super_admin`-approvable flow; visually unmistakable banner in the app; impersonator recorded on every audit entry (`actor` + `on_behalf_of`); sensitive actions (billing, deletes, **approval decisions**) blocked while impersonating by default.
- **Break-glass:** sole-super_admin lockout (lost MFA) is recovered via an ops-side runbook (`docs/runbooks/break-glass.md` — direct DB/CLI procedure with mandatory audit entry), never an in-app backdoor.

## Surfaces (v1)
- **Dashboard:** signups, active orgs, error rate, job queue health, outbox lag, watchdog health strip (from observability metrics) — built with the shared dashboard kit (nextjs plan) as its reference implementation.
- **Performance:** top slow endpoints (from slow-request logs) and top queries (`pg_stat_statements`), per-org request/usage leaderboard, **plus trends from the ops rollups** (endpoint p95 over time, org usage over time, active-users-per-org) with CSV export — the "why is it slow / who is hammering us / since when" page, no external tooling required.
- **Users:** search, view profile + memberships + sessions, verify email manually, lock/unlock account, force password reset, revoke sessions, MFA reset (identity-verification runbook, audited, security-alerted).
- **Organisations:** search, view members/usage/subscription, suspend/unsuspend, storage quota override, restore soft-deleted org.
- **Audit:** platform-wide audit log search (admin actions + security events).
- **Flags:** feature-flag management UI (per feature-flags plan) + staleness report.
- **Email:** email log search, suppression list management, template test-send to self.
- **Storage:** usage by org + trends, quota overrides, quarantined-files queue, orphan/purge job stats (file-uploads plan).
- **Jobs:** link to Hangfire dashboard + dead-letter outbox view with retry/discard.
- **Billing:** subscription state per org, manual plan override (with reason, audited), failed-payment queue.
- **System:** health check status, version/build info, config sanity (non-secret).
- **Settings:** platform-scope settings editor (generated from the settings registry — registration-open, default plan, retention windows, demo-mode posture), with change history via audit.
- **Feedback:** triage inbox (type/status/org/build filters), context detail with correlation-ID deep links, responses, duplicate linking (feedback plan).
- **Announcements:** platform announcements (`announcement`: message, severity, audience — all / org allowlist / plan, starts_at/ends_at, dismissible) → rendered in the app's banner slot; per-user dismissal tracked; optionally mirrored as a notification for logged-out reach. Covers maintenance notices, incident updates, and "what's new" — release notes are announcements, not a separate system. Audited like everything else.

## Non-goals
Customer analytics/BI, content CMS, fine-grained support ticketing — inheriting projects bolt those on as new admin sections (the nav/registry pattern makes admin sections pluggable like modules).

## Milestones
1. Route group + platform roles + admin auth guard + audit wiring.
2. Users + organisations surfaces (read, then actions).
3. Impersonation with guardrails.
4. Flags, email, jobs, billing surfaces (thin UIs over existing module endpoints).
5. Dashboard + system status.
