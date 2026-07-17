# Plan — Feature Flags

## Purpose
Runtime control of feature exposure: kill switches, gradual rollouts, per-organisation entitlements (ties into billing plans), and environment gating — without redeploys.

## Decisions
- **DB-backed, self-hosted** flags (no SaaS dependency in the shell). `IFeatureFlags` interface mirrors OpenFeature semantics so a project can later swap in LaunchDarkly/Flagsmith/OpenFeature provider without changing call sites.
- **Flag model:** key, description, type (boolean now; string/number variants supported in schema for config-style flags), default value, and an ordered **rule list**: environment match, org allowlist, org percentage rollout (stable hash of org_id), plan entitlement (`plan:pro`), user allowlist. First matching rule wins; else default.
- **Evaluation:** server-side, in-process against a cached snapshot (refreshed every ~30s + invalidated by change events). Evaluation context = { user, org, plan, environment }. Zero per-check DB hits.
- **Frontend:** `/api/v1/flags` returns the evaluated flag set for the current user/org (values only, never rules); `useFlag()` hook; SSR reads the same evaluated set via BFF. Client set only contains flags marked `expose_to_client` — server-only flags never ship to the browser.
- **Two flavours, one system:**
  - *Release flags* — temporary, removed after full rollout (staleness report: flags at 100%/0% for >60 days flagged in admin console).
  - *Entitlement flags* — permanent, driven by billing plan (billing-hooks writes plan → flag rules read it).
- **Management:** admin console UI (list, edit rules, per-env values, change history). Every change emits an event → audit log. Changes require `admin.flags.manage`.
- **Code hygiene:** flag keys declared as typed constants in one registry file per app (API + web); architecture test fails on evaluation of unregistered keys.

## Feature access resolution (one question, four answers combined)
Whether a user can see/use a feature is the AND of four independent gates, each owned by a different actor — and callers must never compose them by hand:

1. **Platform flag** (platform admins: rollout/kill/beta) →
2. **Plan entitlement** (billing: is it in the org's plan) →
3. **Org feature toggle** (org admins: generalising the AI opt-out — optional feature areas register an org-scope setting `features.{key}.enabled`; declared per feature, default on) →
4. **Permission** (org admins via roles — including team-targeted role assignments, which is how *per-team* feature restriction works).

- **One evaluator:** `IFeatureAccess.Check(featureKey)` on the API (used by endpoint guards) and one `useFeature(key)` hook on the web (feeding the nav registry, `<Can>`-style gating, and menu items) — both return not just yes/no but *which gate said no*, so the UI can distinguish "hidden entirely" (flag/org-toggle off) from "upgrade CTA" (entitlement) from "ask your admin" (permission), per the existing disabled-vs-hidden menu convention.
- Feature keys register once (feature registry entry declares: flag?, entitlement?, org-toggle?, permission) — gates a feature doesn't use are skipped. Nav items reference the feature key instead of separate flag+permission fields.
- All four gates are already audited, cached (≤60s), and manageable through their existing UIs — this section adds no new storage, only the resolution contract.

## Data model (schema `flags`)
`flag` (key, type, description, expose_to_client, archived_at), `flag_rule` (flag_id, environment, priority, rule_type, rule_config JSONB, value), `flag_change` (who/when/diff — or rely on audit-logs; decision: rely on audit-logs, keep table minimal).

## Endpoints (`/api/v1`)
flags (evaluated set for caller), admin/flags (CRUD + rules, admin console only).

## Milestones
1. Schema + evaluation engine + cache + typed registry.
2. `/flags` endpoint + web hook/SSR integration.
3. Admin console management UI + audit events.
4. Percentage rollout + plan-entitlement rule types; staleness report.
