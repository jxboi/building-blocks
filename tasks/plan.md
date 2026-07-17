# Plan — Task Management (baseline vertical)

## Purpose
A production-quality, deliberately *foundational* task module with two jobs:
1. **Baseline for future verticals** — projects extend it into their product (tickets, cases, work orders, deals) or use it alongside their own features. The extension points are designed, named, and tested — not discovered later.
2. **Permanent integration testbed** — the one feature that exercises every shell seam end-to-end; when a seam contract changes, this module's tests are what breaks first.

It remains an optional module (removable, nothing in the shell depends on it), but unlike a throwaway sample it is built to be *kept*.

## Domain model (core — rich enough to be real, small enough to extend)
- **`task`**: title, description (markdown), **status** (see workflow), **priority** (`none/low/medium/high/urgent`), assignee (single, nullable), reporter (creator), due_date, start_date, completed_at (derived from status category), `parent_task_id` (one level of subtasks — flat hierarchy, no infinite nesting), rank (LexoRank-style string for manual ordering), workspace_id, archived_at.
- **`label`**: org-scoped (name, color), many-to-many with tasks.
- **`comment`**: markdown body, @mentions (drives mention notifications), edited_at; no threading (extension point).
- **`watcher`**: users subscribed to a task's notifications (assignee + reporter auto-watch; mention adds watcher).
- **Attachments**: via file-uploads purpose `task-attachment` (files linked by task id — proves the attachment pattern).
- **`task_link`**: typed task↔task relations — baseline ships `relates_to`; `blocks/duplicates` are registry additions, the table doesn't change.

## Status workflow (the key flexibility decision)
Statuses are **data, not enum** — per-organisation status sets with fixed **categories**:
- Category is one of `todo | in_progress | done` (system-defined, logic hangs off categories); orgs rename/add/reorder statuses *within* categories (e.g. `Backlog, Ready → Doing, In Review → Shipped`). Defaults seeded; last-status-of-category protected from deletion.
- All logic (completed_at, "overdue", board columns, dashboard stats, digest rules) keys off **category**, so custom statuses never break behaviour — the same pattern that makes this safe for a future ticketing/CRM vertical to inherit.
- Status *transition rules* (allowed moves, required fields on transition) are an **extension seam** (`ITaskTransitionPolicy`, default: any→any) — a project adds "can't close with open subtasks" without touching core.

## Assignment
- **Assignable pool = active members of the task's workspace** who pass the task's visibility (private tasks: only users with ACL access). Deactivated members are never assignable; anyone with `tasks.manage` can assign/reassign (including self-assign by any member with task edit rights).
- **People picker is team-aware:** the shared people/team picker groups and filters by team — "assign to anyone from the same team" is the default *experience* (your teammates surface first), while the *pool* stays workspace-wide by default.
- **Restricting the pool is a policy, not a fork:** the transition seam generalises to `ITaskPolicy` (validates status transitions *and* assignments) — default allows any workspace member; a project or org rule ("assignee must share a team with the reporter", "bugs only to the QA team") is one policy implementation. Policy violations return the standard typed 422 with the reason.
- **Assignee lifecycle:** assignment auto-adds the assignee as watcher + fires `task.assigned` (collapse-keyed). When a member is **removed or deactivated**, their open tasks are unassigned in the same cascade (tenancy plan's member-removal rules), watchers + reporter notified, and the tasks surface in a "needs reassignment" saved view — the seed profile's dead-assignee state exists precisely to keep this path tested.
- **Team-queue assignment** ("assign to the Platform team, not a person") is a documented extension, not core: the honest baseline keeps accountability individual; a vertical adds team queues via a task type + extension table (mechanisms 2–3) with its own claim flow.

## Extension architecture (the reason this module exists)
Five sanctioned mechanisms, in order of preference:
1. **Domain events** — `TaskCreated/StatusChanged/Assigned/Commented/Completed/Due` etc.; subscribe from your module (the shell-standard seam).
2. **Task types** — registry: baseline ships `task`; a vertical registers types (`bug`, `case`, `order`) with per-type icon, default status set, and optional extension table.
3. **Extension tables** — 1:1 table keyed by task_id in *your* schema (`crm.deal_details`), joined by your slices; core never knows. The sanctioned alternative to columns-on-task.
4. **UI slots** — task detail panel exposes registered sections/tabs (like the team page and admin console); board/list row badges registrable.
5. **Policies** — `ITaskTransitionPolicy`, and approvals integration (any task action key can be made approvable — `task.delete` wired as the example).

Explicitly *not* a mechanism: adding nullable columns to `task` for product needs (that's what 2–3 replace); per-org custom fields wait for the custom-fields module (master plan) and slot in without schema change here.

## Integration checklist (what it proves, permanently)
Permissions (`tasks.read/manage` + feature key through the four-gate resolver) · nav/entity icon/route (`/[workspace]/tasks`) · filter kit + saved views (status/assignee/label/due/priority, URL-synced) · data table **and board view** (drag = status change + rank update — exercises optimistic updates + conflict handling) · form kit + field errors · **resource ACL** (tasks default workspace-visible; `private` flips on the ACL pattern — reference integration alongside files) · audit + activity feeds (member tier) · notifications registry (`task.assigned`, `task.mentioned`, `task.due_soon` with collapse keys + digest) · **user-schedule primitive** (due-soon reminder job) · search (title/description indexed) · approvals (`task.delete` example) · dashboard kit (workspace home: open-by-status, overdue, completed-this-week) · reports pipeline (task export + completion report) · webhooks (`task.*` events marked external) · **AI substrate reference feature** ("draft description from title" — the ai-integration plan's reference slice lives here) · seed profiles (all states incl. overdue, private, mentioned, dead-linked assignee) · full test stack incl. cross-tenant test + the CI removal test (module delete keeps build green).

## Data model (schema `tasks`)
`task` (as above; indexes `(org_id, workspace_id, status_id, rank)`, `(assignee_id, due_date)`), `status` (org_id, category, name, color, position, is_default), `label`, `task_label`, `comment`, `watcher`, `task_link`, `task_type` (registry-seeded).

## Endpoints (`/api/v1`)
tasks (CRUD, list with filter params, reorder, archive), tasks/{id}/status, /assign, /watchers, /comments (CRUD), /links, /acl (standard resource endpoints); statuses (org admin CRUD within category rules); labels (CRUD); my-tasks (assigned/watching, across workspaces).

## Frontend
List view (data table + filter kit), **board view** (columns = statuses grouped by category, drag-drop), task detail panel (slide-over: description, meta, comments, attachments, activity tab via `ActivityFeed`, registered extension sections), my-tasks page, quick-create (global ⌘K action).

## Non-goals (each is a *documented extension*, not a missing feature)
Sprints/iterations, time tracking, estimates, recurring tasks, threaded comments, multiple assignees, Gantt/dependency scheduling, cross-workspace tasks, portfolios. The README maps each to the mechanism (1–5 above) a vertical would use to add it.

## Milestones
1. Core CRUD + data-driven status workflow + list view + filters + tests.
2. Board view + rank ordering + optimistic drag.
3. Comments/mentions/watchers + notifications + attachments.
4. ACL (private tasks), approvals example, search, activity integration.
5. Dashboard tiles, reports, webhooks-external, due-soon reminders, AI reference feature.
6. Extension seams hardened: task types, extension-table pattern doc, UI slots, transition policy + the CI removal test.
