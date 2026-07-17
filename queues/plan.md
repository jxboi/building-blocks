# Plan — Queue Management (baseline vertical)

## Purpose
A flexible queue primitive — ordered items flowing through waiting → service → done — that products extend into work pipelines (sales rep's new-customer queue), service counters (walk-ins + appointments), support triage, review queues. Like the tasks module: rich enough to use as-is, designed to be extended, and a permanent exerciser of the shell's seams. Optional; nothing depends on it.

## Core concepts
- **Queue**: org- or workspace-scoped; name, **queue type** (registry — see extensions), owner (user or team), **members** (users/teams who work it), settings (per-queue via the settings pattern: visibility, claim mode, SLA targets).
- **Queue item**: what's in line. Subject is either a **registered entity reference** (`ISubjectHost` — customer, task, file, member…) or a free-form payload (name + note — covers walk-ins that exist in no table). Plus: state, rank (manual order within state), priority (`none/low/high/urgent` — bumps ahead of lower priorities, FIFO within), enqueued_at, claimed_by/claimed_at, completed_at, `scheduled_for?` (appointment mode), SLA due_at.
- **States are data with fixed categories** (the tasks-status pattern, reused deliberately): `waiting | active | done | removed` categories; per-queue-type state sets, org-customisable within categories ("Waiting, Contacted → Meeting booked → Won/Lost"). All logic (metrics, boards, SLA, auto-transitions) keys off category.

## Flow mechanics
- **Entry (three doors):**
  1. Manual — member adds an item (quick-add, or "add to queue" action registered on subject entities' context menus);
  2. **Event-driven** — code registration: subscribe any domain event → enqueue (the sales example: `customer.assigned` handler enqueues into that rep's queue — 10 lines in the crm vertical);
  3. **Admin-configured** — the entity-rules action catalogue gains `enqueue into queue` (edge-triggered class) — *"customer tagged At-risk → into the retention queue"* built entirely from the frontend.
- **Claiming:** `claim next` (pull — respects priority+rank, row-locked so two workers never claim the same item) or direct claim; optional **auto-route on entry** via `IQueueRoutingPolicy` (baseline: none | round-robin among members; skills/load-based = policy extensions). Release/requeue supported.
- **Progress:** state transitions (guarded by `IQueuePolicy`, default free), complete/remove; every transition audited + emits events (`queue.item.enqueued/claimed/state_changed/completed` — external-markable for webhooks).
- **SLA (baseline-simple):** per-queue target wait/handle times → `due_at`; breach fires an edge-triggered notification to the queue owner. Anything fancier (business-hours calendars, escalation chains) is a policy extension.

## Appointment mode (the counter example)
A queue may enable **scheduling**: a weekly **slot template** (days, hours, slot length, capacity per slot) + date exceptions (holidays). Booking = creating an item with `scheduled_for` in an open slot (capacity-checked with a row lock); the day-of view merges appointments and walk-ins into one working order (scheduled items auto-surface at their time). Reminder = the existing edge-trigger machinery (`scheduled_for within N hours → notify`). Deliberately **not** built: customer self-booking portals, kiosk/signage displays, SMS-to-external-customers — each is a documented product extension (the last one lands on the notification channel contract when a project needs it).

## Extension architecture (mirrors tasks, same five mechanisms)
1. **Domain events** — subscribe to queue lifecycle from your module;
2. **Queue types** (registry): type declares default state set, icon, card layout hints, allowed subject hosts — `sales-pipeline`, `counter`, `triage` are just registrations;
3. **Extension tables** — 1:1 on queue_item id in your schema for type-specific data;
4. **UI slots** — item card + item detail panel expose registered sections;
5. **Policies** — `IQueueRoutingPolicy`, `IQueuePolicy` (transitions/claims), ordering overrides.
Banned, as ever: product columns on `queue_item`.

## What it proves (integration checklist delta vs tasks)
Row-locked claim semantics (concurrency), slot capacity under contention, the entity-rules → enqueue bridge, subject-host pattern (queue items pointing at *any* registered entity), live-ish queue positions (SignalR group per queue — positions are hints, DB is truth), wallboard-style dashboard tiles (length, avg wait, throughput, SLA breaches), and a second consumer for: people picker, saved views/filters, ActivityFeed, reports (queue performance export), seed states (overdue SLA, double-booked exception, orphaned claim).

## The two worked examples
- **Sales rep:** crm vertical registers `customer` as subject host + enqueues on `customer.assigned`; rep works `claim next` through "Waiting → Contacted"; dashboards show pipeline throughput; entity rule "still Waiting after 3 days → notify rep's team lead".
- **Counter:** ops team creates a `counter`-type queue, enables scheduling (Mon–Fri 9–5, 15-min slots, capacity 2), books appointments against customers or walk-in payloads; day view runs the line; SLA breach pings the owner.

## Data model (schema `queues`)
`queue` (org, workspace?, type, name, owner, settings), `queue_member`, `queue_state` (queue_type/org, category, name, position), `queue_item` (queue_id, subject_type?, subject_id?, payload JSONB?, state_id, category (denorm), rank, priority, claimed_by, enqueued_at, scheduled_for?, due_at, completed_at), `slot_template` (queue_id, weekday, start, end, slot_minutes, capacity), `slot_exception` (queue_id, date, closed|override).

## Endpoints (`/api/v1`)
queues (CRUD, members), queues/{id}/items (add, list by state, reorder), items/{id} (claim, release, state, complete, remove), queues/{id}/claim-next, queues/{id}/slots?date= (availability), book; my-queue-items.

## Frontend
Queue board (columns by state, drag within/between per policy), **working view** ("next up" + claim button — the heads-down mode), appointment day/week view, item detail slide-over (subject link, timeline via ActivityFeed, extension slots), wallboard dashboard tiles, admin: queue settings + state editor + slot template editor.

## Non-goals
Skills-based routing, business-hour SLA calendars, customer self-service booking, kiosk displays, external-party notifications (SMS), cross-queue orchestration — all documented extensions on the seams above.

## Milestones
1. Queues/items/states + manual entry + claim-next (row-locked) + board & working views.
2. Event + entity-rule entry doors; routing policy (round-robin); notifications + SLA edge triggers.
3. Appointment mode: slots, booking, day view, reminders.
4. Dashboards/reports/webhooks/search + seed scenarios + policies hardened + extension docs.
