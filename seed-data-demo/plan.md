# Plan — Seed Data & Demo Mode

## Purpose
Three related capabilities: (1) **system seeding** the app needs to boot (roles, permissions, plans, flags), (2) **dev/demo fixtures** — a rich, realistic dataset for local development, testing, and sales demos, (3) **demo mode** — a runtime posture that lets anyone explore a live instance safely.

## Decisions

### System seeding (always on, every environment)
- Idempotent seeders run by the migrator step after migrations: permission registry → DB, system roles, plan catalogue, flag registry, baseline notification/email template registrations. Re-runnable; additive; never overwrites operator edits (upsert by key, respect `is_system`).

### Fixture seeding (dev/staging/demo only)
- **Bogus**-based deterministic generator (fixed seed ⇒ same data every run ⇒ stable screenshots/tests). Profiles: `minimal` (1 org, 3 users — CI/integration tests), `standard` (3 orgs incl. one big one, workspaces, invites in all states, files, notifications, audit history, subscriptions across plans/states — daily dev), `demo` (curated realistic company narrative with polished names/avatars — sales).
- Seeds exercise **every module's states**: pending/expired invites, suppressed email address, quarantined file, past_due subscription, dead-letter job, custom role — so edge-case UI is developable without manual setup.
- Invoked via `just seed [profile]` and an API `POST /api/v1/dev/seed` guarded to non-production environments (hard-blocked by env check, not config).
- **Well-known demo credentials** documented (`owner@demo.local` / seeded password) for `standard`/`demo`; never seeded in production.

### Demo mode (runtime flag `DEMO_MODE=true`)
- Purpose: public sandbox / instant product tour without sign-up friction.
- Behaviour: "Try the demo" entry auto-signs into an **ephemeral copy** of the demo org (per-visitor org cloned from the template org by a fast seeder, tagged `is_demo`); banner across the app; destructive/external actions disabled (emails go nowhere — sender forced to null provider; billing forced to NullBillingProvider; webhooks off; AI forced to the fake provider; file uploads capped small; admin console inaccessible).
- **Nightly reset job:** purge demo orgs older than 24h (background-jobs). Rate-limit demo-org creation per IP.
- Implemented as a small policy layer (`IDemoRestrictions`) consulted by the relevant modules — each module's plan already exposes the seams (provider swap, policy check); this module just flips them.

## Structure
```
apps/api/src/Modules/Seeding/    seeders, profiles, Bogus fakers, demo-clone service
```

## Testing tie-in
`minimal` profile is the shared fixture for integration tests (fast, deterministic); Playwright smoke runs against `standard`.

## Milestones
1. System seeders in migrator step (needed from phase 2 onward).
2. Fixture engine + `minimal` profile + test harness adoption.
3. `standard` profile covering all module states.
4. `demo` profile + demo mode restrictions + nightly reset.
