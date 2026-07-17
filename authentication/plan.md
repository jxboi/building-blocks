# Plan — Authentication

## Purpose
Who the user is. Registration, login, session lifecycle, password hygiene, MFA seam, API keys for machine access. Everything downstream (tenancy, RBAC) hangs off the identity established here.

## Decisions
- **ASP.NET Identity** for user store + password hashing (Argon2id via configured hasher), `citext` email uniqueness.
- **Tokens:** short-lived JWT access tokens (~10 min) + **rotating refresh tokens** (opaque, hashed at rest, family-revocation on reuse detection). Refresh token delivered to the web app as httpOnly Secure cookie via the Next.js BFF; native/API clients use the token endpoint directly.
- **Concurrent-refresh safety:** benign races (two tabs / parallel requests refreshing at once) must not trip reuse detection — the BFF **single-flights** refreshes (one in-flight refresh per session; concurrent requests await it), and the API allows a short **grace window** (~30s) in which the immediately-previous token of a family may be replayed, returning the same successor. Reuse *outside* the grace window (or of an older generation) is the theft signal → family revocation + security event. Tested explicitly: the two-tabs test and the stolen-token test both pass.
- **JWT claims kept minimal:** `sub`, `email`, `session_id`. Org/role/permission claims are *not* embedded (they change too often); tenant context resolved per request server-side.
- **Email verification** required before org creation; **password reset** via single-use, expiring, hashed tokens.
- **MFA:** TOTP (RFC 6238) as optional, recovery codes; enforced-MFA-per-organisation as a policy flag (hook for roles-permissions module).
  - **Recovery ladder:** recovery codes (self-service) → support-assisted reset via admin console (`admin.users.mfa_reset`: identity verification per documented runbook, audited, security alert to all user's channels, forced re-enrolment on next login). No self-service email-only MFA reset — that would reduce MFA to password+email.
  - **No SMS OTP, deliberately** (SIM-swap risk, delivery cost/flakiness) — recorded as a rejected factor, not an omission.
  - **Passkeys/WebAuthn (designed-for, second factor first):** the credential table is designed now (`webauthn_credential`: user_id, credential_id, public_key, sign_count, transports, name); ships after TOTP as an alternative second factor. Passwordless-passkey-as-primary is a later, separate decision.
  - **Trusted device (optional, org-policy-controlled):** "remember this device for 30 days" via a signed device cookie; org policy can disallow it; admin-console sessions never honour it.
- **Social login / SSO:** OIDC external providers (Google, Microsoft) behind a provider abstraction — implemented as extension, off by default. Enterprise SAML/OIDC SSO is explicitly a future module, but the account-linking table is designed now.
- **API keys:** per-user or per-workspace machine keys (`bb_live_...` prefix, hashed, last-4 stored for display), scoped to permission subsets; authenticated via dedicated header, never mixed with user JWT flows.
- **Session management UI:** users can list/revoke active sessions (device, IP, last seen).

## Data model (schema `auth`)
`user`, `user_credential` (Identity tables), `refresh_token` (hash, family_id, expires_at, revoked_at, replaced_by), `external_login`, `mfa_totp`, `mfa_recovery_code`, `api_key`, `session` (metadata for UI), `email_token` (verify/reset, purpose enum).

## Endpoints (`/api/v1/auth`)
register, login (returns access + sets refresh), refresh, logout (revoke family), verify-email, resend-verification, forgot-password, reset-password, change-email (token sent to new address; security alert to old; email unverified until confirmed), mfa/enroll, mfa/verify, mfa/disable, sessions (list/revoke), api-keys (CRUD), me/export (GDPR data export — a registered report type on the reports pipeline, see `reports/` plan), me/delete-account.

## Account lifecycle rules
- **Change email:** two-sided — confirmation token to the new address, security alert to the old one; org allowed-email-domain policies re-checked on confirm.
- **Delete account (right to erasure):** blocked while the user is sole owner of any shared org (must transfer or delete the org first); personal org is purged; the user row is **anonymised** (email → tombstone, credentials/tokens/sessions/API keys destroyed), not hard-deleted — FKs stay valid, audit entries remain meaningful via denormalised `target_label`. Uploaded files remain org property.
- **Org-enforced MFA:** when an org sets `enforce-MFA`, tenant-resolution middleware returns a typed 403 (`urn:bb:mfa-required`) for that org's context until the user enrols; frontend routes to MFA setup.

## Security requirements
- Rate limit auth endpoints aggressively (per-IP and per-account buckets); constant-time credential responses; no user-enumeration in error messages (uniform "if this account exists…" responses).
- Lockout with exponential backoff after repeated failures.
- All auth events (login success/failure, password change, MFA change, token reuse detected) emit domain events → audit-logs + notifications (security emails).
- Secrets: JWT signing key via env (dev) / KMS (prod), rotation procedure documented.
- **High-value columns encrypted at the application layer** (Data Protection): TOTP secrets, OAuth connection tokens (integrations plan); recovery codes and API keys stored hashed (never encrypted-recoverable); refresh tokens hashed. DB-level encryption at rest is assumed from the provider but never solely relied on for these.
- Cookies (BFF session/refresh): `httpOnly; Secure; SameSite=Lax`, host-prefixed names.

## Events published
`UserRegistered`, `UserEmailVerified`, `UserLoggedIn`, `PasswordChanged`, `MfaEnabled/Disabled`, `RefreshTokenReuseDetected`, `ApiKeyCreated/Revoked`.

## Milestones
1. Identity setup, register/login/refresh/logout with rotation + tests (incl. reuse-detection test).
2. Email verify + password reset (depends on email-delivery; use dev Mailpit).
3. Session listing/revocation + security events.
4. TOTP MFA + recovery codes.
5. API keys.
