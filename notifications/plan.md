# Plan — Notifications

## Purpose
One pipeline that turns domain events into user-facing notifications across channels: in-app (bell + realtime), email digests, and Slack via the connections vault (integrations plan — Slack registers as an additional channel dispatcher; outbound webhooks are integrations' own concern, not a notification channel). Inheriting projects add notification types, not plumbing.

## Decisions
- **Notification types are declared** in a registry (key, default channels, template refs, grouping rules) — mirrors the permission-registry pattern.
- **Fan-out pipeline:** domain event → notification handler resolves audience (e.g. "org admins", "mentioned user") → per-recipient `notification` row → channel dispatchers (in-app immediately; email respecting user preferences: instant / hourly digest / daily digest / off).
- **Channel contract (`INotificationChannel`):** channels are registry entries — key, dispatcher, per-channel capabilities (supports digests? requires linking? requires pre-approved templates?), and an optional **link flow** for channels needing a per-user handle. In-app and email ship built-in; Slack registers via the integrations vault. The preference matrix, digest engine, and dedupe logic are channel-agnostic — a new channel is one dispatcher + registry entry.
- **Channel linking:** `channel_link` (user_id, channel, external_handle, verified_at) for channels that need a per-user identity (Slack DM id, Telegram chat id, WhatsApp number with recorded opt-in consent + timestamp).
- **Designed-for future channels (not built):** **Telegram** — bot + deep-link verification onto `channel_link`; cheap, good first messaging channel. **WhatsApp** — Meta Cloud API/Twilio; per-channel constraints matter: messages must use pre-approved templates (maps onto the notification-type registry), strict opt-in (the `channel_link` consent fields exist for this), per-message cost → default to security/critical types only. **Mobile push (APNs/FCM)** — the channel a future mobile app needs: `device` registration endpoint (per-user device tokens, platform, last_seen — a `channel_link` sibling), provider seam over FCM/APNs, payloads carrying the same deep-link targets as in-app notifications, badge counts from the existing unread query, token-invalidation handling on provider feedback. None require pipeline changes — that's the point of the contract.
- **In-app:** `notification` rows queried by bell UI; **SignalR** hub pushes new-notification + unread-count to connected clients; graceful fallback to polling. **Reconnect discipline:** automatic reconnect with jittered backoff; on reconnect the client reconciles by refetching unread state (pushes are hints, the DB rows are truth — a dropped connection can never lose a notification); sustained failure degrades to polling silently.
- **Scale-out note:** single API instance needs nothing extra; running multiple instances requires the Redis backplane (config-enabled, compose profile) — without it, clients degrade to the polling fallback rather than silently missing pushes.
- **Preferences:** per-user per-type per-channel matrix with sane defaults; security-critical notifications (password changed, new login) are **not** mutable to off.
- **Digests:** background job batches pending email notifications **per user per cadence into a single email, grouped by organisation inside it** (a user in 3 orgs gets 1 digest, not 3); email-delivery renders/sends.
- **Grouping/dedupe:** collapse key (e.g. `file.commented:{fileId}`) updates existing unread notification instead of stacking; idempotency key prevents duplicate fan-out on event redelivery.
- **Retention:** in-app notifications pruned after 90 days (job).

## Messages (composed broadcasts + inbox)
User-authored one-to-many messages riding the existing pipeline — the "leader mails the team" capability, deliberately short of chat:
- **Compose:** subject + markdown body (+ optional attachments via file purpose `message-attachment`) to an **audience**: one or more teams, workspaces, the whole org, or named members. Audience resolves to recipients at send time and is **snapshotted** (later team joins don't receive old mail; the send record shows exactly who got it).
- **Who can send (contextual, mirroring team-lead capabilities):** team leads → their teams; `messages.send_workspace` / `messages.send_org` permissions for wider audiences (org roles decide). All sends audited (`admin` visibility tier).
- **Inbox:** a `Messages` view alongside the notification center (`/messages`): list with sender, subject, sent time, read state; message detail page renders the full body/attachments. Delivery reuses the fan-out: each recipient gets a `message.received` notification (bell + SignalR + email per their channel preferences) that deep-links to the message — so the inbox works on day one across every channel, including a future mobile push, for free.
- **Read tracking:** per-recipient read state (the sender — and only the sender — sees an aggregate read count, not per-person read receipts by default; a `read_receipts` org toggle enables the detailed view for orgs that want it).
- **Non-goals (the chat boundary, recorded):** no replies, no threads, no realtime composer presence, no 1:1 DM semantics beyond selecting a single member as the audience — a messaging/chat product is a vertical built on its own model; this is *notice*, not *conversation*. Retention follows a settings-registry window (default 1 year).

## Data model (schema `notif`)
`notification` (recipient_user_id, org_id, type, payload JSONB, collapse_key, read_at, seen_at, created_at), `notification_preference` (user_id, type, channel, enabled), `channel_link` (user_id, channel, external_handle, verified_at, consent_at?), `digest_queue` (user_id, notification_id, cadence, flushed_at), `message` (org_id, sender_id, subject, body, audience JSONB snapshot, sent_at), `message_recipient` (message_id, user_id, read_at).

## Endpoints (`/api/v1`)
notifications (list, cursor), notifications/mark-read (single/all), notifications/unread-count, me/notification-preferences (get/put). SignalR hub `/hubs/notifications` (JWT auth on connect).

## Frontend
Bell with unread badge, popover list (grouped, relative time, deep links from payload), full notifications page, preferences matrix in settings.

## Baseline notification types
Invite received/accepted, role changed, mention (seam for product features), file shared, export ready, billing events (payment failed, trial ending), security alerts.

## Milestones
1. Registry + fan-out pipeline + in-app rows + REST endpoints.
2. SignalR realtime + bell UI.
3. Preferences + enforcement in dispatchers.
4. Email digests via background jobs.
5. Retention + collapse/dedupe hardening.
