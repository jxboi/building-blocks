# Plan — Email Delivery

## Purpose
All outbound email through one pipeline: provider abstraction, templating, sending via background jobs, suppression handling, and full local dev support (every email visible in Mailpit, none escaping to real inboxes).

## Decisions
- **`IEmailSender` abstraction** (to, template, model, org context) with providers: **SMTP** (dev → Mailpit container; also covers self-hosted prod), **Resend** and **Amazon SES** adapters (config-selected). Adding a provider = one class.
- **Templating: Razor components rendered to HTML** (single language across the stack’s backend, type-safe models) + a shared MJML-derived base layout compiled once for email-client-safe markup; plain-text alternative auto-generated per template. Templates live in code (versioned, reviewed), not a DB editor — inheriting projects add template classes.
- **Per-org branding:** the base layout consumes branding tokens (logo, display name, accent colour) from `org_setting`, falling back to platform defaults — org-facing emails (invites, digests, notifications) carry the customer's branding without per-org templates. Platform/security emails always use platform branding. No customer-editable template *content* (that stays a rejected editor).
- **Locale seam:** every send carries a locale (recipient preference → org default → `en`); template strings resolve through the same key-based mechanism as the web app. Shell ships `en` only; adding a locale is translation files, not code.
- **Always async:** nothing sends inline. `SendEmail` enqueues a `critical`-queue job; retries with backoff on provider failure; final failure → alert + `email_log` failure row.
- **Email log:** every send recorded (recipient, template, provider message ID, status: queued/sent/delivered/bounced/complained/failed, org_id) — feeds admin console troubleshooting ("did the invite email go out?") and idempotency (dedupe key prevents double-sends on retry).
- **Suppression list:** hard bounces + complaints (via provider webhooks: SES SNS / Resend webhooks) auto-suppress the address; sends to suppressed addresses are skipped and logged; admin console can view/clear. Transactional-only shell — **no marketing/bulk email**, so no unsubscribe-list management beyond suppression (notification preferences handle digest opt-out).
- **Deliverability baseline documented:** SPF/DKIM/DMARC setup per provider, dedicated `from` subdomain recommendation (`mail.example.com`), link domain notes. Checklist in module README.
- **Safety rails:** non-production environments hard-restrict recipients (allowlist domains or catch-all redirect to Mailpit) — enforced in the sender, not by convention.

## Baseline templates
verify-email, reset-password, invite, security-alert (new login / password changed / MFA changed), notification-digest, export-ready, billing (payment-failed, trial-ending, receipt seam).

## Data model (schema `email`)
`email_log` (as above, partitioned by month, 90-day retention job), `suppression` (address citext, reason, created_at).

## Endpoints
Provider webhook receivers (`/api/webhooks/email/{provider}`, signature-verified); admin endpoints for log search + suppression management.

## Milestones
1. Abstraction + SMTP/Mailpit + Razor template pipeline + base layout.
2. Async sending via jobs + email_log + dedupe.
3. Auth + invite templates wired (unblocks authentication milestone 2).
4. Provider adapters (Resend, SES) + webhooks + suppression.
