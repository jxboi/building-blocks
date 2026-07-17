# Plan — Organisations & Workspaces

## Purpose
The tenancy backbone. An **organisation** is the billing/security boundary (tenant); **workspaces** are collaboration sub-containers within it. Every tenant-owned row in the system references these.

## Decisions
- **Hierarchy:** User ⟷ Organisation (membership, many-to-many) → Workspace (membership optional per user). Two container levels only — no arbitrary workspace nesting; inheriting projects that need folders/projects add them *inside* workspaces.
- **Teams (orthogonal grouping):** organisations contain teams (nestable via `parent_team_id`, depth ≤ 5, cycle-checked) for grouping people — e.g. Engineering → Platform. Teams carry no permissions themselves; they act as *principals* for role assignments and as approval-routing targets (see roles-permissions plan). Team membership has a `lead | member` role.
- **Team-lead capabilities (contextual, not org-wide):** checks consult `team_member.role = lead` *for that team* (incl. ancestor-team leads) rather than granting broad permissions. Leads get: manage own team membership, edit team profile, a **team page** (members, their org-role labels, pending team invites, sub-teams) and a **team activity feed** — `member`-tier audit entries by team members (audit-logs plan), the same events those members' workspace colleagues already see, just filtered by team. Never `admin`/`internal` tiers, never private-resource contents — being a lead widens *grouping*, not *clearance*. The whole lead view is governed by the org feature toggle `features.team-activity.enabled` for orgs that don't want it.
- **Progress monitoring is product, not shell:** the team page is an extensible surface (registered tabs, like admin sections) — inheriting projects add "Tasks", "Goals", or workload dashboards there using the dashboard kit; the shell deliberately ships no task/progress model.
- **Org chart (reporting lines):** optional `manager_id` on `organisation_member` (cycle-checked, multiple roots allowed) models who reports to whom. Consumed by the approvals engine (manager/skip-level strategies) and an org-chart UI; safe to leave unmaintained (consumers must define fallbacks).
- **Slugs:** org and workspace have URL-safe unique slugs (org-unique globally, workspace-unique per org); used in web routes (`/[workspace]/...` with org resolved from session's active org).
- **Personal org:** every user gets an auto-created personal organisation on first login (keeps all flows uniform); flag `is_personal` disables member invites on it. Downstream projects can turn this off via config.
- **Tenant resolution:** middleware resolves org from (in order) explicit `X-Organisation-Id` header (API clients) → route value → user's default; validates membership; populates `ITenantContext`. Workspace resolved similarly where routes are workspace-scoped.
- **Invitations:** email-based, token link, pending-invite record with role; acceptance flow handles both existing users and new registrations. Expiry + resend + revoke.
- **Lifecycle:** soft-delete orgs with 30-day grace (restore possible), hard purge via background job; workspace archive/unarchive; ownership transfer flow (must always have ≥1 owner).

## Data model (schema `tenancy`)
`organisation` (name, slug, is_personal, deleted_at), `organisation_member` (user_id, org_id, manager_id → organisation_member, joined_at, deactivated_at?), `workspace` (org_id, name, slug, archived_at), `workspace_member` (workspace_id, user_id), `team` (org_id, parent_team_id?, name, slug, is_default, archived_at), `team_member` (team_id, user_id, role: lead|member), `invitation` (org_id, email, initial_role_id, initial_team_ids, token_hash, expires_at, status), org-level policies (enforce-MFA, allowed-email-domains, default timezone, branding tokens) live in the **settings registry** (dotnet-api plan, `kernel.setting` with org scope) — this module declares them, no bespoke `org_setting` table.

Note: role links live in `perm.role_assignment` (roles-permissions plan), not on membership rows — memberships record *belonging*, assignments record *authority*. Invitations carry an initial role + teams applied on acceptance.

## Endpoints (`/api/v1`)
orgs (CRUD, transfer-ownership, restore), orgs/{id}/members (list/remove, set-manager, deactivate/reactivate), orgs/{id}/invitations (create/list/revoke/resend), invitations/accept, workspaces (CRUD, archive), workspaces/{id}/members, teams (CRUD, nest/re-parent, archive), teams/{id}/members (add/remove/set-lead), me/memberships (drives the org/workspace switcher). Role changes go through role-assignment endpoints (roles-permissions).

## Rules
- Removing a user's last owner role is rejected.
- Org deletion requires owner + explicit name confirmation; cascades are handled by the purge job, not FK cascade storms.
- **Purge cascade** (process-manager flow, see background-jobs plan): cancel provider subscription → delete storage objects → emit per-entity deletion events (search documents, notifications, ACLs cleaned by their owners) → hard-delete rows.
- **Member removal:** their reports' `manager_id` re-points to the removed member's own manager (or null → roots); their in-flight approval requests auto-cancel; team memberships and role assignments are deleted (events fire for cache/audit).
- **Member deactivation (reversible suspension, `members.manage`):** `deactivated_at` set — tenant resolution rejects that org context (typed 403), effective permissions evaluate to none, API keys they created for the org stop working, their user-schedules pause, and they drop out of approval routing (in-flight snapshots re-evaluate quorum like a removal). Everything else is **retained**: memberships, role assignments, team membership, manager lines, ACL grants, history — so reactivation is one field flip that restores access exactly as it was (assignments re-validated against current entitlements). Deactivated members are labelled in member lists, don't count toward seat entitlements (billing plan), and can't be the last active owner. Both transitions emit events → audit + cache invalidation. This is distinct from platform-level account lock (admin console, all orgs) and account deletion (permanent, anonymising).
- **Archived workspace:** read-only for all members, hidden from the switcher by default, excluded from default search scope; unarchive restores everything.
- **Slugs are mutable** (org: owner; workspace: admin) with no redirect table — old deep links 404. Accepted trade-off; revisit only if a project needs stable external links.
- **Renames (org/workspace/team) are ordinary audited updates** with defined ripples: audit history keeps the historical `target_label` (renames never rewrite the past), search documents refresh via the update events, notifications/emails render the current name at send time. Nothing else references names — everything joins by ID.
- **No cross-org transfers** (workspace, teams, or content between organisations) — the org boundary is permanent by design (ACLs, audit, billing, files all assume it). The path is export → import into the target org (reports pipeline + file download); a true migration tool is a product decision, not shell.
- **Bulk membership:** CSV bulk-invite (email, role, teams) with per-row validation report — same invitation mechanics, just batched; seat entitlement checked for the whole batch up front.
- **Duplicate invitations** to an existing member or an already-pending email are rejected with a typed conflict.
- All member/role/invite changes emit domain events → audit-logs + notifications.

## Events published
`OrganisationCreated/Deleted/Restored`, `MemberInvited/Joined/Removed/Deactivated/Reactivated`, `ManagerChanged`, `WorkspaceCreated/Archived`, `TeamCreated/Archived/Reparented`, `TeamMemberAdded/Removed/LeadChanged`, `OwnershipTransferred`. (Role-change events are published by roles-permissions.)

## Milestones
1. Org + membership model, tenant-resolution middleware, `ITenantContext` (unblocks the query-filter work in postgresql plan).
2. Workspaces + membership + switcher endpoints.
3. Invitations end-to-end (email via email-delivery).
4. Teams: CRUD, nesting, membership, leads (+ events consumed by roles-permissions evaluation).
5. Org chart: manager lines + tree/chain queries + UI.
6. Lifecycle: soft delete, restore, purge job, ownership transfer.
