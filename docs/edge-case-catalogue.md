# Edge-Case Catalogue

The consolidated reference of every hard scenario established during planning. Three uses:
1. **Acceptance source** — when a module is built, its rows here become tests (the "Expected" column is the assertion).
2. **Regression map for upgrades** — before/after any enhancement, sweep the affected domain's rows.
3. **Edge probing** — the documented limits of what the system is designed to handle; anything beyond a row here is untested territory by definition.

Companion: `stress-test-2026-07-16.md` (the original 48-scenario review). Conventions: *bound* = staleness/timing guarantee; mechanisms cite the owning plan.

---

## 1. Auth & sessions

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| A1 | Two tabs refresh the same session simultaneously | Both succeed — BFF single-flights; API grace window (~30s) replays previous token to same successor. No logout, no family revocation | authentication |
| A2 | Stolen refresh token replayed outside grace window / older generation | Family revoked, all sessions killed, security event + notification | authentication |
| A3 | Login brute force / credential stuffing | Per-IP + per-account buckets, exponential lockout, uniform "if this account exists" responses (no enumeration) | authentication |
| A4 | Org enforces MFA; member not enrolled opens org context | Typed 403 `urn:bb:mfa-required` → frontend routes to enrolment; other orgs unaffected | authentication + tenancy |
| A5 | User changes email | Token to new address, security alert to old, unverified until confirmed, domain policy re-checked | authentication |
| A6 | Account deletion while sole owner of a shared org | Blocked until transfer/delete org; personal org purged; row anonymised (tombstone) — audit labels survive | authentication |
| A7 | Session expires mid-form-edit | Silent refresh; if truly dead: login redirect with return-URL + draft restore (sessionStorage, long forms) — no lost work | error-handling |
| A8 | API key used after owner loses permissions / leaves / is deactivated | Re-validated at use → typed 403 | authentication + RBAC |
| A9 | MFA device lost | Recovery codes → support-assisted reset (identity runbook, audited, all-channel alert, forced re-enrol). Never email-only self-reset | authentication + admin |
| A10 | Sole super_admin loses MFA | Ops break-glass runbook only — no in-app path | admin-console |

## 2. Tenancy, org & team lifecycle

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| T1 | Any query for tenant-owned data without org filter | Impossible by construction (EF global filters); cross-tenant test suite is a permanent CI gate | postgresql |
| T2 | Two concurrent requests each remove one of the last two owners | One blocked — `FOR UPDATE` on the owner-set invariant; never zero owners (incl. via team-grant removal) | transactions + RBAC |
| T3 | Manager leaves org | Reports re-point to their manager (or root); in-flight approvals from them auto-cancel; assignments/teams cleaned with events | tenancy |
| T4 | Member deactivated | Access cut everywhere (tenant 403, permissions none, API keys dead, schedules paused, approval routing skips); everything retained; seat freed; reactivation = flip + seat re-check. Cannot deactivate last active owner | tenancy + billing |
| T5 | Org purged after grace | Process-manager cascade: cancel provider subscription → delete storage objects → per-entity deletion events (search/notif/ACL cleanup) → hard delete. Resumable at any step | tenancy + jobs |
| T6 | Org/workspace/team renamed | Audit keeps historical label; search reindexes via events; live surfaces show new name; slug change = old links 404 (recorded trade-off, no redirects) | tenancy |
| T7 | Workspace archived | Read-only, hidden from switcher, out of default search; unarchive restores | tenancy |
| T8 | Invite to existing member / already-pending email | Typed duplicate conflict | tenancy |
| T9 | Bulk CSV invite exceeding seats | Whole batch seat-checked up front; per-row validation report | tenancy + billing |
| T10 | Team re-parented | Members' effective permissions change; caches invalidated by event; audited | tenancy + RBAC |
| T11 | Team nesting: cycle / depth > 5 | Rejected at write | tenancy |
| T12 | Cross-org transfer of workspace/content | Not supported by design — export → import path. Org boundary is permanent | tenancy (recorded non-goal) |

## 3. Authorization (RBAC, ACL, field policies, temporary access)

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| Z1 | Role/team change while user browsing | Reads correct within ≤60s cache bound (instant same-instance via events; instant everywhere with Redis L2); mutations always re-validate at DB | RBAC + caching |
| Z2 | Temporary grant expires mid-session | Treated as absent immediately at evaluation; sweeper hard-deletes + revocation event + pre-expiry notice | RBAC |
| Z3 | JIT elevation | Approvable action → executor writes grant *with* expires_at — auto-revocation structural | RBAC + approvals |
| Z4 | Private resource in another user's search | Never appears — post-filter delegates to `IResourceAuthorizer` even on a stale index | search + RBAC |
| Z5 | Search page where ACL filters out most hits | Overscan + refill until page full; cursor on last *authorised* hit; counts as "10+" never exact | search |
| Z6 | Guarded field (e.g. salary) via export / AI prompt / audit metadata / search doc / cache | Never present — single shaping rule enforced at all five exits | field policies |
| Z7 | Unauthorised field smuggled into PATCH | 400 with field error — rejected, never silently dropped | field policies |
| Z8 | Org admin needs a private resource (compliance) | `{module}.admin_override` — works, distinctly audited | RBAC |
| Z9 | "Why can this user do X?" | `?explain=` returns the full assignment chain (direct/team/ACL, incl. expiring) | RBAC |
| Z10 | ACL grant to team; sub-team added beneath later | Sub-team members covered — transitive resolution at evaluation time | RBAC |

## 4. Approvals

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| P1 | Approver loses `approvals.decide` before deciding | Decision rejected — permission checked at decision time | approvals |
| P2 | Requester removed mid-flight | Request auto-cancels | approvals |
| P3 | Policy edited/disabled with requests in flight | In-flight continue under their snapshot; explicit admin cancel available | approvals |
| P4 | State changed between approval and execution | Executor re-validates permissions + preconditions; failure surfaces on the request | approvals |
| P5 | Approver removed/deactivated empties a step | Quorum re-evaluated; escalation if empty | approvals |
| P6 | Approver = requester | Blocked by default (policy flag to allow) | approvals |
| P7 | Org chart unmaintained but policy says "manager" | Fallback approver: org admins | approvals |
| P8 | Single admin tries to remove the four-eyes policy itself | Routed through the approval it created — bootstrap loophole closed | approvals |
| P9 | Support impersonating a user attempts an approval decision | Blocked — on the impersonation blocklist (with billing, deletes) | admin-console |

## 5. Concurrency & transactions

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| C1 | Two users edit the same record | Second gets 409 `conflict:concurrency` → conflict dialog (their values preserved, review & reapply / discard) — never silent overwrite | error-handling |
| C2 | Double-click / client retry of a POST | 409 `conflict:duplicate` via natural key → client treats as already-done | resilience |
| C3 | Seat/quota/counter races | `FOR UPDATE` row locks per invariant; DB constraints as final guard | transactions |
| C4 | Any external call inside a DB transaction | Forbidden by policy — external-first with provisional state, or outbox-after | transactions |
| C5 | Outbox message redelivered / processed concurrently | Idempotency key per subscriber; `locked_until` claim; exactly-once *effect* | jobs |
| C6 | Poison message | Dead-letter after N retries + alert; admin retry/discard | jobs |
| C7 | Worker crash mid multi-step process (org purge, dunning) | Process-manager resumes from persisted step | jobs |
| C8 | Transient DB failure mid-command | Whole unit-of-work retries (safe: handlers are pure DB work) | transactions |
| C9 | Board drag: two users move the same card | Rank/status via optimistic concurrency — second gets conflict, board refetches | tasks |
| C10 | Two workers `claim next` on one queue item | Row-locked claim — exactly one wins | queues |
| C11 | Appointment booking at slot capacity, concurrent | Capacity check under row lock — no overbooking | queues |

## 6. Caching & staleness bounds

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| K1 | Role changed on instance A; user hits instance B | Stale read ≤60s (TTL bound); instant with Redis L2; mutations unaffected (DB re-check) | caching |
| K2 | Cache key missing tenant | Impossible by construction — `CacheKey.For(org,…)` required; bare keys fail review | caching |
| K3 | Flag flipped | Client set refreshes ≤30s server + staleTime tier client; kill switch honours same bound | flags |
| K4 | Redis (L2/backplane) dies | Caches degrade to L1+TTL; SignalR → polling. Degraded, never wrong | resilience |
| K5 | Revoked user still sees cached page data | Display-only staleness ≤ tier bound; any action re-validates → 403 | caching + RBAC |

## 7. Resilience, timeouts, degradation

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| R1 | Postgres down | Fail fast: 503, readiness pulls instance from rotation. No pretend mode | resilience |
| R2 | Email provider down | Users unaffected — queued sends retry with backoff; sustained → alert; email_log records | email + jobs |
| R3 | Stripe down | Entitlements keep working from local state; checkout/portal fail gracefully; reconciliation heals after | billing |
| R4 | Search backend down | Typed `search-unavailable`; palette degrades to nav-only + banner; page unaffected | search |
| R5 | AI provider down / berserk | Feature-level typed error; per-feature kill switch; circuit breaker visible as metric | ai + flags |
| R6 | Request abandoned (user navigates away) | Cancellation flows to EF — work stops, logged as cancelled not error | timeouts |
| R7 | Timeout nesting violated (outer < inner) | Design rule: client 30s > server > DB 30s > provider 10–15s; long work → job + notification | timeouts |
| R8 | SignalR connection drops | Auto-reconnect w/ backoff; on reconnect refetch unread (pushes are hints, rows are truth — nothing lost) | notifications |
| R9 | Widget's endpoint fails | That widget degrades (boundary + inline fallback); page survives | error-handling |
| R10 | Deploy while tabs open | `X-Build-Id` mismatch → refresh banner; blocking only on actual contract-mismatch failure; never force-reload over unsaved work | version skew |
| R11 | Two-year-old mobile client | `/meta/client-requirements` → graceful force-upgrade gate | dotnet-api |

## 8. Jobs, schedules & time

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| J1 | User schedule "Mon 9am Singapore" across DST of server TZ | Fires 9am local always (IANA tz + Cronos) | jobs |
| J2 | System down over several schedule firings | Coalesce: one catch-up run, never N backfills | jobs |
| J3 | Schedule creator leaves org | Schedule pauses + org admins notified | jobs |
| J4 | Same digest event delivered twice | Collapse key + idempotent fan-out — one notification | notifications |
| J5 | User in 3 orgs, daily digest | One email, grouped by org | notifications |
| J6 | Recurring job overlaps its previous run | Prevented — concurrent-execution locks per job | jobs |

## 9. Billing

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| B1 | Webhooks out-of-order / duplicated / missed | Idempotent by provider event id; daily reconciliation re-syncs truth | billing |
| B2 | 10 members, downgrade to 5-seat plan | Members retained; invites blocked until under limit; never auto-evict | billing |
| B3 | Deactivating a member at seat limit | Frees the seat; reactivation re-checks | billing + tenancy |
| B4 | Price/entitlement change on a plan | New `key@version`; existing subs grandfather until bulk-migrated (audited) | billing |
| B5 | Enterprise "+50 seats" hand-shake deal | Entitlement override (reason, expiry, audited); survives plan changes; invisible to reconciliation | billing |
| B6 | Second trial attempt | Blocked — one-trial-per-org tracked locally | billing |
| B7 | Payment fails repeatedly | past_due → grace → configurable read-only; dunning notifications; provider owns retry schedule | billing |
| B8 | Upgrade vs downgrade timing | Upgrade immediate (prorated); downgrade at period end — no mid-cycle yanking | billing |

## 10. Files & images

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| F1 | Upload started, never confirmed | Orphan sweeper reconciles pending rows + storage | files |
| F2 | Spoofed MIME (exe as .png) | Magic-byte sniff at confirm → rejected/quarantined | files |
| F3 | Two presigns race past quota | Accepted race — enforced at presign, reconciled at confirm (recorded trade-off) | files |
| F4 | DB restored but bucket drifted (or vice versa) | Checksum-sampled integrity audit detects; restore runbook reconciles | files |
| F5 | Storage provider switch | Opaque keys → rclone sync + config; dual-read on 404 for zero-downtime | files |
| F6 | Avatar changed | New content-hashed URL (old caches irrelevant); EXIF stripped; re-encoded | files/images |
| F7 | Private image revoked | Worst case: presign bucket window (≤6h) — bounded, recorded | images |
| F8 | 12MB phone photo upload | Client downscales/re-encodes first (~400KB); server re-validates regardless | images |
| F9 | Template PDF with embedded JS | Stripped; never executed; output flattened | document-templates |
| F10 | PDF binding to a guarded field | Blocked — bindings resolve through shaped DTOs | document-templates |

## 11. Custom fields, rules & tags

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| X1 | Source field changes (joined_at edited) | Derived values recompute via save interceptor | custom-fields |
| X2 | Derived definition created/edited on existing data | Backfill job with progress; values materialised (filterable/exportable) | custom-fields |
| X3 | Derived from `now()` ("days until expiry") | Not storable by design — UI formatting over stored date; time lives in rule evaluation | custom-fields |
| X4 | Derived-from-derived chains | One level; deeper blocked (recompute topology stays trivial) | custom-fields |
| X5 | Rule "expiring in 30 days → notify" over 30 days | Fires **once** on entering match set (`rule_match` memory); quiet while matching; re-arms after leaving (renewal → future re-alert works) | entity rules |
| X6 | Rule condition stops matching | State actions revert (rule-managed tag removed); manual tag of same name untouched | entity rules |
| X7 | Rule action triggers another rule | Impossible — no chaining, single-pass | entity rules |
| X8 | Admin enables a rule blind | Dry-run first: current match count + samples | entity rules |
| X9 | Rule errors repeatedly | Auto-disabled + admin notification | entity rules |
| X10 | Definition deleted with data present | Archived (values retained, hidden); purge is explicit second step | custom-fields |

## 12. Tasks & queues (baseline verticals)

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| Q1 | Org renames/adds statuses ("Shipped") | Everything keyed off *category* keeps working (board, stats, overdue, completed_at) | tasks/queues |
| Q2 | Last status of a category | Protected from deletion | tasks/queues |
| Q3 | Assignee removed/deactivated | Open tasks unassigned in the cascade; watchers+reporter notified; "needs reassignment" view | tasks |
| Q4 | Assign to deactivated member / non-visible private task | Not in pool / blocked by ACL check | tasks |
| Q5 | "Assignee must share reporter's team" org rule | One `ITaskPolicy` implementation → typed 422 | tasks |
| Q6 | Queue item's subject entity deleted | **TO SPECIFY at build:** item keeps label snapshot + marked subject-deleted (deletion event), never dangles silently | queues |
| Q7 | SLA breach | Edge-triggered notify to owner, once per episode | queues |
| Q8 | Walk-in + appointments same day | Day view merges into one order; scheduled items surface at their time | queues |
| Q9 | Holiday | Slot exception closes the template for that date | queues |

## 13. Notifications, messages & channels

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| N1 | User disables security notifications | Not possible — security types locked on | notifications |
| N2 | Rapid repeated events (10 comments on one file) | Collapse key updates one unread item | notifications |
| N3 | Message sent to team; member joins tomorrow | Doesn't receive it — audience snapshotted at send | messages |
| N4 | Sender wants per-person read receipts | Aggregate count by default; per-person only behind org `read_receipts` toggle | messages |
| N5 | Hard bounce / spam complaint | Address auto-suppressed; future sends skipped + logged; admin can clear | email |
| N6 | Push token invalidated (app uninstalled) | Provider feedback removes device registration | notifications (mobile) |
| N7 | Notification deep-links to deleted resource | Standard 404 surface; notification text still renders (label in payload) | notifications |

## 14. Feature access & visibility

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| V1 | Same feature: flag off vs no entitlement vs no permission vs org toggle off | Distinct UX: invisible / upgrade CTA / "ask admin" (disabled+why) / invisible — resolver returns *which gate* failed | feature access |
| V2 | Developer composes gates by hand | Forbidden — single `IFeatureAccess`/`useFeature`; endpoints declare feature keys | feature access |
| V3 | Team lead views member activity | `member`-tier only, own team, org-toggleable — grouping widens, clearance doesn't | teams + audit |
| V4 | Workspace member tries to widen audit query past their floor | Enforced filter floor — cannot | audit-logs |

## 15. Feedback

| # | Scenario | Expected | Mechanism |
|---|---|---|---|
| FB1 | Bug report submitted after an error | Recent correlation IDs auto-attached (shown to user pre-send) — operator deep-links to logs/audit | feedback |
| FB2 | Org admin tries to view members' feedback | Cannot — feedback is submitter↔platform only, by design | feedback |
| FB3 | Duplicate reports of one bug | Closed as duplicate linked to canonical; *all* duplicate submitters notified on resolution | feedback |
| FB4 | Feedback spam | Per-user rate cap (settings registry); demo mode: feedback disabled | feedback |
| FB5 | Submitter's account deleted before resolution | Anonymised tombstone (standard erasure); item retained for triage, notifications cease | feedback + auth |

## 16. Open edges (known-unspecified — specify before or during build)
- Q6 above (queue subject deletion) — proposed behaviour written, needs confirmation at build.
- Entity-rule sweeps on very large orgs (100k+ members): batch sizing/pacing declared but unmeasured — needs a load test at milestone.
- Draft persistence (A7) × field policies: ensure drafts in sessionStorage never hold guarded-field values for forms the user lost permission to mid-edit.
- Expiry-bucketed presign (F7) × immediate legal takedown: bucket window is the bound — if a project needs instant revocation, variant URLs must move behind the app proxy (documented trade-off to revisit).
- Message retention (1y default) × GDPR erasure of the *sender*: tombstone rules cover authorship display; confirm message body handling at build.

---
*Maintenance rule: any new module/mechanism PR that introduces an edge adds its row here; any row proven by an automated test gets linked to that test. Rows without tests are the current risk surface.*
