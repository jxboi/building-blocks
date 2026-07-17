# Plan — Feedback & Comments

## Purpose
A built-in channel for users to report bugs, request features, or comment on any part of the system — with enough auto-captured context to be actionable, a triage surface for the platform team, and a closed loop back to the submitter. Optional module; nothing depends on it.

## Decisions

### Submission (from anywhere)
- **Global entry points:** a "Send feedback" item in the user menu + help menu (and `?` shortcut overlay); plus an optional **contextual entry** on entity detail surfaces ("Give feedback on this") registered via the same subject-host pattern queues use — feedback can reference a task, a document template, a report run.
- **Feedback types are a registry** (extensible, like everything): baseline `bug`, `feature_request`, `general`. A type declares its form hints (bug asks "what did you expect?") and routing default.
- **Auto-captured context, shown to the user before sending** (consent by transparency): current route, workspace/org, app build id (`X-Build-Id`), browser/viewport, the user's recent error correlation IDs (last ~5 from the session's error toasts — turns "it broke" into a traceable report). No silent capture beyond that list; screenshots are explicit (paste/upload via file purpose `feedback-attachment`, standard pipeline).
- Rate-limited per user; available in demo mode? **No** — demo restrictions apply (feedback off, like webhooks).

### Visibility (deliberate)
- Feedback is **submitter ↔ platform team**, not org-visible: org admins do *not* see members' submissions (bug reports and complaints deserve privacy). Submitter sees their own history + status in settings ("My feedback"); platform admins see everything.
- Submissions are org-tagged for context/aggregation but are **not** tenant collaboration data.

### Triage & the closed loop
- **Statuses (fixed, small):** `new → acknowledged → closed(resolved | declined | duplicate)` — this is operator triage, not a customer workflow; no custom statuses here.
- **Admin console surface:** feedback inbox (filter kit: type/status/org/date/build), detail view with full context (deep link from correlation ID to logs/audit), status changes, and **operator responses** — a lightweight bounded thread (operator replies, submitter may follow up; not a conversation product).
- **Loop closure:** status changes and responses notify the submitter (`feedback.updated` notification type — bell + email per preferences). Duplicate-closing links to the canonical item so all duplicate submitters get notified on resolution.
- **Sinks (seam, off by default):** `IFeedbackSink` forwards new items to an external tracker (GitHub Issues, Linear) via the integrations OAuth vault; `feedback.submitted` also emits as a domain event (external-markable) for webhook-based routing. Triage can stay in-app forever or become a thin mirror of the real tracker — deployment's choice.

## What it reuses (nearly everything)
Files (attachments), notifications (loop closure), filter kit + admin console (triage), correlation IDs (error linkage), build id (version pinning), subject hosts (entity references), integrations (tracker forwarding), audit (status changes at `internal` tier), settings registry (rate caps), seed data (items across all states).

## Data model (schema `feedback`)
`feedback_item` (org_id, submitter_id, type, status, close_reason?, message, route, build_id, context JSONB, subject_type?, subject_id?, duplicate_of?, created_at), `feedback_response` (item_id, author_id (platform), body, created_at), attachments via file linkage.

## Endpoints (`/api/v1`)
feedback (submit), me/feedback (list own + detail + follow-up); admin/feedback (inbox, detail, respond, status, mark-duplicate).

## Frontend
Feedback modal (type picker, message, context preview chips, attachment paste), "My feedback" page in settings (status badges, thread view), admin inbox on the filter kit + dashboard stat tile (new feedback count).

## Non-goals (each mapped to its home if wanted later)
Public roadmap / feature voting portals (product decision; the data model's duplicate-linking gives vote-counts-by-duplicates for free), support ticketing with SLAs and assignment (that's the queues module — a `triage` queue consuming `feedback.submitted` is a 20-line integration if a team wants pull-based triage), NPS/CSAT surveys (different instrument; a future type registration at most), community forums.

## Milestones
1. Submit + context capture + "My feedback" + admin inbox (statuses, filters).
2. Responses + notifications loop + duplicate linking.
3. Attachments + contextual entity entry + rate caps + seed states.
4. `IFeedbackSink` (GitHub/Linear reference) + external event + dashboard tile.
