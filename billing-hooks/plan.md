# Plan — Billing Hooks

## Purpose
The billing *seam*, not a billing product: plans, subscriptions, entitlements, and provider webhooks abstracted so an inheriting project can wire Stripe (reference implementation), Paddle, LemonSqueezy, or invoice-manually — while the rest of the shell only ever asks "what plan is this org on, and what is it entitled to?"

## Decisions
- **Core owns the domain model** (plan, subscription, entitlements); **provider owns money** (payment methods, invoices, tax, checkout UI). We never store card data; checkout and payment-method management happen on provider-hosted pages (Stripe Checkout + Billing Portal in the reference implementation).
- **`IBillingProvider` interface:** create-checkout-session, create-portal-session, cancel/resume, sync-subscription. Plus a webhook translator per provider that converts provider events into our domain events (`SubscriptionActivated/Updated/Canceled`, `PaymentFailed`, `TrialWillEnd`).
- **Plans defined in code/config** (key, name, entitlement set, provider price IDs per environment) — seeded to DB; the provider dashboard mirrors, never masters, the catalogue. **Intervals:** price mappings carry monthly *and* annual variants per plan.
- **Plan versioning (grandfathering):** plans are `key@version`; changing entitlements or price creates a new version — **existing subscriptions keep their version** until explicitly migrated (bulk-migrate tool in admin console, audited). Archived versions vanish from the public catalogue but keep working. Without this, the first pricing change becomes a fire drill.
- **Custom/enterprise deals:** per-org **entitlement overrides** (audited, admin console, with reason + optional expiry) layered over the plan — sales can grant +50 seats or a flag without inventing a plan per customer. Overrides survive plan changes; reconciliation ignores them (they're ours, not the provider's).
- **Metered usage (designed-for, off by default):** entitlement counters (AI credits, API calls) can be declared *metered* — a nightly job reports aggregated quantities to the provider (Stripe metered prices) via `IBillingProvider.ReportUsage`. Local `ai_usage`-style tables stay the source of truth for display and enforcement; the provider only bills.
- **Plan-change timing rules:** upgrades apply **immediately** (provider prorates, entitlements re-evaluate on the webhook); downgrades apply **at period end** (scheduled provider-side; entitlements untouched until then — no mid-cycle capability yanking). Interval switches follow the same rule as their direction.
- **Trial policy:** per-plan config — length, card-required-or-not, one-trial-per-org enforced locally (tracked on the org, not trust in the provider). `TrialWillEnd` → dunning notification path already planned.
- **Entitlements bridge to feature-flags:** plan → entitlement flags (`plan:pro` rule type from feature-flags plan) + numeric limits (`seats`, `storage_gb`, `workspaces`) exposed via `IEntitlements` checked at enforcement points (invite, upload presign, workspace create). Over-limit behaviour: block with upgrade CTA, never silent data loss. **Downgrade rule:** dropping below current usage (e.g. 10 members onto a 5-seat plan) keeps existing members/data intact and blocks new invites/uploads/workspaces until back under limit — no auto-eviction. **Seat counting:** only active members consume seats — deactivated members (tenancy plan) free theirs; reactivation re-checks the seat limit.
- **Webhook handling:** signature-verified receiver → persist raw event (idempotency by provider event ID) → enqueue processing job → translator → domain events → subscription state updated + notifications (payment failed, trial ending) + audit log. **Reconciliation job** (daily) re-syncs subscriptions against provider truth to heal missed webhooks.
- **States:** `trialing → active → past_due → canceled` (+ `incomplete`); grace-period policy configurable; downgrade-to-free behaviour defined per project (shell default: read-only past grace).
- **No provider = still works:** `NullBillingProvider` puts every org on the default plan — billing UI hidden. This is the "delete this module" story: flip config, remove folder later.

## Delegation boundary (explicitly the provider's job — we build no UI or model for these)
Payment methods, invoices & receipts (portal link in-app, not an invoice list), tax/VAT calculation and filing (Stripe Tax or equivalent), coupons/promo codes (enabled at provider checkout; never modeled locally), multi-currency pricing (per-provider prices), refunds & credits (provider dashboard; resulting webhooks update our state), payment retries/smart dunning schedules (provider's; our dunning is the *user-notification* layer). If a project needs in-app invoice lists later, it's a read-through of the provider API — still no local invoice model.

## Data model (schema `billing`)
`plan` (key, version, name, entitlements JSONB, archived_at), `price_mapping` (plan_key, version, provider, environment, interval, provider_price_id), `subscription` (org_id, plan_key, plan_version, provider, provider_subscription_id, status, current_period_end, trial_end, canceled_at, pending_downgrade_to?), `entitlement_override` (org_id, key, value, reason, granted_by, expires_at?), `billing_event` (provider, provider_event_id unique, payload, processed_at, status), `usage_report` (org_id, meter_key, period, quantity, reported_at — metered billing only).

## Endpoints (`/api/v1`)
billing/plans (public catalogue), orgs/{id}/billing (subscription state + portal/checkout session creation, `billing.manage` permission), `/api/webhooks/billing/{provider}`.

## Frontend
Settings → Billing page: current plan, usage vs limits, upgrade (→ provider checkout), manage (→ provider portal). Plan-gate components (`<RequiresPlan>`), upgrade CTAs on entitlement blocks.

## Milestones
1. Domain model + `IBillingProvider` + Null provider + entitlements bridge.
2. Stripe reference: checkout, portal, webhook translator, idempotent processing.
3. Enforcement points (seats/storage/workspaces) + upgrade UX.
4. Reconciliation job + dunning notifications + audit wiring.
