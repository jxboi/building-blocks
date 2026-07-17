# Plan — Integrations (Connectors to External Services)

## Purpose
Two customer-facing primitives that every SaaS eventually needs, built once: **outbound webhooks** (orgs subscribe endpoints to our events) and **external connections** (an OAuth credential vault so product features can call third-party APIs on an org's behalf). Infrastructure-side providers (email/storage/billing/search) are *not* this module — they're operator-chosen seams in their own plans.

## Not in scope (see master plan → Rejected Alternatives)
Zapier-style automation builders, an app marketplace/directory, per-user app installs, inbound public-API expansion (API keys already cover machine access).

## Part 1 — Outbound webhooks
- **Public event catalogue:** only domain events explicitly marked `external` in the event registry are subscribable (allowlist — internal events never leak). Payload is a **versioned envelope** (`event`, `version`, `occurred_at`, `organisation_id`, `data`) and becomes public contract; changes follow additive-only rules.
- **Endpoints:** org admins (`integrations.manage`) register URL + subscribed event types + description. **SSRF guard:** https only, DNS-resolved against private/link-local ranges at registration *and* delivery time.
- **Delivery:** rides the outbox → a dispatcher job per delivery; HMAC-SHA256 signature header over timestamp+body (documented verification snippet, 5-min replay window); exponential backoff retries up to 24h; endpoint **auto-disabled after sustained failure** (e.g. 3 days) with admin notification; per-endpoint delivery log (status, latency, response code, truncated response) with manual redeliver; 90-day log retention.
- **Secrets:** per-endpoint signing secret, rotation with dual-secret overlap window.
- Demo mode forces webhooks off (seed-data-demo plan). All endpoint changes audited.

## Part 2 — External connections (OAuth vault)
- **Provider registry** (standard pattern): providers declared in code — auth style (OAuth2 auth-code / API key), scopes, endpoints, token-refresh behaviour. The shell implements the **generic OAuth2 dance once** (initiate, callback, state validation, PKCE); adding a provider is registry config + any provider-specific quirks.
- **`connection` storage:** org-scoped (optionally user-scoped where the provider requires it), tokens **encrypted at rest** (ASP.NET Data Protection, key-management notes per environment), status lifecycle (active / expired / revoked / error).
- **Consumption seam:** features call `IConnections.GetAccessToken(provider, org)` — automatic refresh, never expose refresh tokens; on unrecoverable failure the connection flips to `error` and org admins get a "reconnect" notification.
- **Reference provider: Slack** — implemented as an additional notification channel (notification types can fan out to a connected Slack channel), proving the vault + a real consumer end-to-end. Optional; off unless configured.
- Settings UI: connections list (status, scopes, connect/reconnect/revoke), webhook endpoints management + delivery log viewer.

## Inbound helper (small)
A shared signed-webhook receiver utility (signature verify, raw-body capture, idempotency-by-event-id) — already needed by billing/email provider receivers; exposed so product features receiving third-party webhooks reuse it instead of hand-rolling.

## Data model (schema `integr`)
`webhook_endpoint` (org_id, url, secret_hash pair, event_types[], disabled_at, failure_streak), `webhook_delivery` (endpoint_id, event envelope ref, attempt, status, response_code, latency_ms, next_retry_at — partitioned, 90-day retention), `connection` (org_id, user_id?, provider, scopes, encrypted_tokens, status, connected_by, expires_at).

## Endpoints (`/api/v1`)
webhook-endpoints (CRUD, rotate-secret, test-delivery), webhook-endpoints/{id}/deliveries (list, redeliver), connections (list, initiate, callback, revoke). All under `integrations.manage`.

## Events published
`WebhookEndpointCreated/Disabled`, `ConnectionEstablished/Revoked/Errored` (→ audit + notifications).

## Removal notes
Optional module: without it, provider webhooks (billing/email) keep their own receivers via the inbound helper (which then lives in Kernel); no other module depends on this one.

## Milestones
1. Public event catalogue flag + webhook endpoints + signed delivery + retries/auto-disable.
2. Delivery log + redeliver + rotation + SSRF guard tests.
3. OAuth vault: generic flow, encrypted storage, refresh, `IConnections`.
4. Slack reference channel + settings UI polish.
