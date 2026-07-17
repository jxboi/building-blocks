# Plan Stress Test — 2026-07-16

Scenario-based review of all module plans. Verdicts:
- ✅ **Holds** — plan already covers it (mechanism cited)
- 🔧 **Gap → fixed** — real gap; a minimal rule/convention was added to the plan (no new mechanism unless stated)
- 📋 **Out of scope** — deliberately not handled by the shell; recorded so inheriting projects know

Guiding constraint: fixes must not complicate the design. Nearly every fix below is a sentence-long rule riding on an existing mechanism.

---

## Identity & authentication

| # | Scenario | Verdict |
|---|---|---|
| 1 | User changes their email address | 🔧 No flow existed. Added: verify-new-address token flow + security alert to old address. |
| 2 | User invokes right-to-erasure (GDPR) / deletes account | 🔧 No flow existed. Added account-deletion rules: blocked while sole owner of a shared org; personal org purged; user row anonymised (tombstone), audit survives via denormalised `target_label`; async data export (`me/export`) seam. |
| 3 | Refresh token replayed after logout | ✅ Family revocation on reuse detection (auth plan). |
| 4 | Same email, different casing, registers/invited twice | ✅ `citext` uniqueness (postgresql/auth plans). |
| 5 | Org policy requires MFA; member hasn't enrolled | 🔧 `enforce-MFA` org_setting existed but no enforcement point. Added: tenant-resolution middleware returns typed 403 until enrolment. |
| 6 | API key used after owner loses permissions / leaves org | ✅ Keys re-validated against current effective permissions at use (auth + RBAC plans). |
| 7 | Login brute force / credential stuffing | ✅ Per-IP + per-account rate buckets, lockout backoff, uniform responses (auth plan). |
| 8 | User active in app while their org is soft-deleted | ✅→rule: tenant resolution rejects; frontend 403 flow (error-handling) redirects to switcher. Covered by existing pieces. |

## Tenancy, teams, org chart

| # | Scenario | Verdict |
|---|---|---|
| 9 | Last owner tries to leave / be demoted (incl. via team grant removal) | ✅ Last-owner protection, extended to team-derived paths (RBAC plan). |
| 10 | A manager leaves the org — reports dangle | 🔧 Added rule: reports re-point to the departed member's own manager (or become roots). |
| 11 | Circular reporting line / team nesting cycle | ✅ Cycle checks on both (tenancy plan). |
| 12 | Team re-parented — members silently gain broader access | ✅ `TeamReparented` event invalidates permission caches; audit-logged (both plans). |
| 13 | Workspace archived — what can members still do? | 🔧 Semantics were undefined. Added: archived = read-only, hidden from switcher by default, excluded from default search. |
| 14 | Org/workspace slug renamed — old deep links | 🔧 Undefined. Added explicit trade-off: slugs mutable, no redirect table, old links 404. Cheap and honest; revisit only if a real project needs redirects. |
| 15 | Invitation sent to an existing member | 🔧 Added rule: rejected with typed conflict. |
| 16 | Org purged after grace period — external residue | 🔧 Purge cascade was underspecified. Added: purge is a process-manager flow that cancels the provider subscription, deletes storage objects, emits per-entity deletion events (search/docs/notifications cleanup), then hard-deletes. |
| 17 | User belongs to 2 orgs; requests interleave | ✅ `ITenantContext` per request from header/route + membership validation; background jobs set org context explicitly (jobs plan). |

## RBAC, ACLs, field policies, temporary access

| # | Scenario | Verdict |
|---|---|---|
| 18 | "Why can this user see that?" support ticket | ✅ `?explain=` endpoint traces assignment chain. |
| 19 | User removed from team while holding a page open | ✅ Per-request evaluation against invalidated cache; ACL checked on next request. |
| 20 | Temporary grant expires mid-session | ✅ Expired rows treated as absent immediately; sweeper + pre-expiry notification. |
| 21 | Private file appears in another user's search results | ✅ Search post-filter delegates to `IResourceAuthorizer`; stale index can't leak. |
| 22 | Salary field leaks via CSV export or audit metadata | 🔧 Indexes/caches were covered; exports weren't. Added: all exports run through field-policy shaping under the *requester's* permissions. |
| 23 | ACL grant to a team, then sub-team added under it | ✅ Transitive downward resolution at evaluation time. |
| 24 | Unauthorised field smuggled into a PATCH | ✅ Write-side mirror rejects with field error (never silently drops). |
| 25 | Admin needs access to a private resource (compliance) | ✅ `{module}.admin_override`, distinct audit action. |

## Approvals

| # | Scenario | Verdict |
|---|---|---|
| 26 | Approver loses `approvals.decide` mid-flight | ✅ Permission re-checked at decision time. |
| 27 | Requester leaves org before decision | 🔧 Added rule: in-flight requests auto-cancel on requester removal. |
| 28 | Policy edited/disabled with requests in flight | 🔧 Added rule: in-flight requests continue under their snapshot; admins may cancel explicitly. |
| 29 | State changed between approval and execution | ✅ Executor re-validates permissions + preconditions at execution time. |
| 30 | All approvers on leave | ✅ Delegation + expiry/escalation (fallback: org admins). |
| 31 | Approver is the requester | ✅ Self-approval blocked by default. |

## Billing & entitlements

| # | Scenario | Verdict |
|---|---|---|
| 32 | Webhooks arrive out of order / duplicated / missed | ✅ Idempotency by provider event ID + daily reconciliation job. |
| 33 | Org with 10 members downgrades to a 5-seat plan | 🔧 Over-limit principle existed; added the concrete rule: existing members retained, new invites blocked until under limit (no auto-eviction, no data loss). |
| 34 | Payment fails repeatedly | ✅ `past_due` → grace → configurable read-only; dunning notifications. |
| 35 | Project doesn't want billing at all | ✅ `NullBillingProvider` = everyone on default plan; UI hidden. |

## Files, search, notifications

| # | Scenario | Verdict |
|---|---|---|
| 36 | Upload started, never completed | ✅ Orphan sweeper reconciles `pending` rows. |
| 37 | Two presigns race past the storage quota | ✅ Accepted small race: enforced at presign, reconciled at confirm. Not worth a locking mechanism. |
| 38 | Malicious file with spoofed MIME | ✅ Magic-byte sniffing at confirm; EXIF strip on avatars; scanner seam. |
| 39 | User in 3 orgs — 3 digest emails? | 🔧 Undefined. Added: one digest per user per cadence, grouped by org inside the email. |
| 40 | Two API instances — SignalR breaks | 🔧 Real scale-out gap. Added: single-instance default documented; multi-instance requires Redis backplane (config-on) or falls back to polling. |
| 41 | Notification deep-links to a deleted resource | ✅→convention: standard 404 handling (error-handling plan); payloads carry labels so the notification text still renders. |
| 42 | Full reindex needed after mapper change | ✅ Per-type reindex command, async, admin-only. |

## Operations, admin, demo

| # | Scenario | Verdict |
|---|---|---|
| 43 | Deploy with a failing migration | ✅ Migrator gates rollout; expand/contract discipline; never migrate on app start in prod. |
| 44 | Rate limiting across multiple instances | 🔧 Noted: in-memory limiter is per-instance — acceptable (limits are approximate); documented rather than adding Redis. |
| 45 | Support impersonates a user and decides an approval | 🔧 Added: approval decisions join billing/deletes on the default impersonation blocklist. |
| 46 | Sole super_admin loses MFA device | 🔧 Added: break-glass recovery runbook (ops-side, documented in docs/runbooks — no in-app backdoor). |
| 47 | Demo visitor tries to send email / hit webhooks / upload huge files | ✅ Demo restrictions force null providers, cap uploads, block admin console; nightly purge; per-IP creation limit. |
| 48 | Deterministic test data drifts from real edge cases | ✅ Seed profiles deliberately include every module's failure states (past_due, quarantined, dead-letter, expired invites…). |

## Explicitly out of scope (unchanged, on purpose)

Deny/negative permissions · ABAC rule engines · matrix-org multiple managers · runtime-configurable field rules · column encryption · public link sharing (schema-ready only) · BPMN/visual workflow builders · customer-built automation (product vertical) · universal business-object engine (custom-fields module is the future escape valve) · multi-region/active-active deployment · SCIM/SAML enterprise SSO (account-linking table designed to accommodate later).

## Conclusion

The architecture held at the mechanism level — no scenario required a new subsystem. Every fix (14 of 48 scenarios) was a missing *rule* on an existing mechanism: lifecycle edges (email change, account deletion, purge cascade, manager departure), undefined semantics (archived workspaces, slugs, digests, seat downgrade), and two genuine ops notes (SignalR backplane, per-instance rate limits). The registry/event/seam patterns absorbed everything else, which is the property the shell exists to provide.
