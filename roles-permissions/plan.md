# Plan — Roles & Permissions

## Purpose
Authorisation and organisational structure enforcement: what a member may do inside an organisation/workspace, how people are grouped (teams), how reporting lines are modelled (org chart), and how sensitive actions can be routed through approvals. Inheriting projects extend all four with their own permissions, team usage, and approvable actions — without touching core code.

## Structural model (overview)

```
Organisation                        ← tenant / security boundary
├── Workspaces                      ← collaboration containers (tenancy module)
├── Teams                           ← people grouping, optionally nested (tenancy module owns data)
│   └── Sub-teams…                  ← e.g. Engineering → Platform → SRE
├── Reporting lines (org chart)     ← manager_id per member (tenancy module owns data)
└── Role assignments                ← this module: principal × scope × role
```

- **Principals:** a role can be assigned to a **user** or a **team**. Assigning to a team grants the role to all its members, including members of descendant sub-teams (GitHub-style downward inheritance).
- **Scopes:** an assignment targets the **organisation** (applies everywhere) or a **workspace** (applies there only).
- **Teams and the org chart are structure, not permission containers by themselves** — they only affect access through role assignments (teams) and approval routing (reporting lines). This keeps "why can this user do X?" answerable from one table.

**Authorization is evaluated in four layers**, coarse to fine — a request must pass every applicable layer:

| Layer | Question | Mechanism |
|---|---|---|
| 1. Platform | May this user use this surface at all? | platform roles (admin console plan) |
| 2. RBAC | May they perform this *kind* of action here? | permissions via role assignments (org/workspace scope) |
| 3. Resource | May they act on *this specific record*? | resource visibility + ACL grants (opt-in per entity type) |
| 4. Field | May they see/edit *this field* of it? | field policies at the DTO projection layer (opt-in per field) |

Layers 3 and 4 are opt-in seams: most entity types need only layers 1–2, and nothing pays for what it doesn't use.

## Permissions & roles (unchanged foundations)
- **Permissions are the atom** — fine-grained strings `resource.action` (`members.invite`, `files.delete`, `billing.manage`, `approvals.decide`). Code checks permissions, never role names.
- **Roles are permission bundles.** System roles seeded per org: `Owner`, `Admin`, `Member`, `Viewer` (non-editable). **Custom roles** per organisation supported from day one.
- **Registration:** each module declares its permissions in `PermissionRegistry`; seeded to DB on startup; unknown-permission checks fail tests. Inheriting projects append entries.
- **No deny rules — additive only.** Restriction is achieved by granting less at org level and elevating per workspace/team. Keeps evaluation simple, cacheable, and auditable.

## Role assignments & evaluation
- Single table `role_assignment` (principal_type: user|team, principal_id, scope_type: org|workspace, scope_id, role_id). The old "role column on membership" becomes a user-principal org-scope assignment — one model for everything.
- **Effective permissions of user U in workspace W** = union of permissions from:
  1. U's org-scope assignments (direct),
  2. org-scope assignments of any team U belongs to (directly or via a descendant sub-team),
  3. workspace-W-scope assignments for U and U's teams.
- **Evaluation is cached** per (user, org) with workspace overlays; invalidated by events: role edited, assignment changed, team membership changed, team re-parented.
- **Explainability endpoint:** `GET /me/permissions?explain=files.delete` returns the assignment chain that grants it (support + debugging gold).
- API keys carry an explicit permission subset (≤ creator's effective permissions at creation; re-validated at use).
- Enforcement stays ASP.NET policies: `.RequirePermission("files.delete")`; architecture test requires every endpoint to declare a permission or `AllowAnonymous`.
- **Contextual capabilities (second sanctioned check type):** some authority derives from a *relationship*, not a role — team leads over their own team (`teams.manage_own`, team activity feed, team messages), resource `manager` level on ACLs, "own profile" edits. These are relationship checks evaluated against the target (is lead of *this* team / manager of *this* resource), never expanded into blanket permission grants. Rule: prefer a permission when authority is org-wide; use a contextual check when it's per-target — and every contextual check lives in the owning module's authorizer, not inline in handlers.

## Teams
Data lives in tenancy (`team`, `team_member`, `parent_team_id` — see organisations-workspaces plan); this module consumes them for evaluation and assignment targets.
- Nesting capped (depth 5), cycle-checked; `is_default` flag optional ("everyone" team auto-maintained, handy for org-wide grants).
- Team roles within a team: `lead` | `member`. Leads matter for approvals routing and can manage their team's membership (`teams.manage_own`).
- Workspace access via teams: assign a team a role scoped to a workspace — the standard way to onboard a whole department.

## Org chart (reporting lines)
- `manager_id` on `organisation_member` (nullable; cycle-checked; multiple roots allowed). Owned by tenancy; consumed here.
- Derived views: management chain of a member (walk up), direct reports (walk down), org chart tree endpoint for UI.
- Primary consumer is the **approvals engine** ("manager", "manager chain up to level N", "skip-level"). Secondarily: audit context and future HR-ish features in inheriting projects.
- Org chart is optional per org — approval strategies that reference managers fail gracefully (fallback approver: org admins) when lines aren't maintained.

## Resource-level access (per-record ACLs)
For entity types where "can read files" isn't enough and "can read *this* file" matters (private docs, shared folders, product entities).

- **Opt-in per entity type** via `IResourceAuthorizer<T>` registration; entities implement `IAccessControlled` (type key + owning workspace/org). Types that don't register skip layer 3 entirely.
- **Visibility mode on the resource row** (owned by each module): `org` | `workspace` (default) | `private`. `private` means only the ACL grants below apply.
- **ACL grants** in one shared table: (resource_type, resource_id, principal user|team, access_level, expires_at?). Access levels are a small ordered ladder per type — default `viewer < commenter < editor < manager` — mapped by the registering module onto its fine actions. Team grants resolve transitively like role assignments.
- **Creator is implicit `manager`**; `manager` may share (grant/revoke), transfer, and change visibility. Sharing UI is a shared component (people/team picker + level dropdown), reused by any registered type.
- **Evaluation order:** RBAC gate first (`files.read` — cheap, cached), then resource check (visibility → ACL lookup, batched for list endpoints). List queries push the ACL predicate into SQL via a reusable EF expression — no load-then-filter.
- **Admin override:** org members holding `{module}.admin_override` bypass resource ACLs (support/compliance cases); every override access is audit-logged with a distinct action.
- **Search integration:** the `visibility` field + post-filter hook already in the search plan now formally delegate to `IResourceAuthorizer` so search results never leak private records.
- **Link sharing** (tokenised "anyone with the link" URLs) is designed as a future grant type on the same table (`principal_type: link`), not built in the shell.

## Field-level visibility
For a handful of genuinely sensitive fields (compensation, PII, internal notes) — not a general row/column security system.

- **Declared in code at the DTO layer:** `FieldPolicy<MemberDto>(x => x.Salary).Requires("members.compensation.read")` — policies live next to the DTO, registered like everything else. A response-shaping step in the endpoint pipeline strips unauthorised fields before serialization; the field is *absent*, not null-with-a-lie.
- **Write-side mirror:** update endpoints run the same policies as validators — an unauthorised field in a PATCH is rejected (400 with field error), never silently ignored.
- **Contract honesty:** OpenAPI marks policy-guarded fields as optional; the generated TS types make them `field?:` so the frontend handles absence by construction. UI components render fallbacks (`•••` / hidden section) off absence + `useCan()`.
- **Where it applies everywhere:** audit-log metadata and search documents must store only the unrestricted projection (or per-visibility variants) — guarded fields never enter caches/indexes that bypass shaping. **Exports too:** every export path (CSV/audit/data export) runs through the same shaping under the *requester's* permissions — and **AI prompts** likewise (ai-integration plan): guarded fields never reach a model.
- Deliberately **not** per-org configurable (no runtime field-rule builder) and **not** column encryption — those are project-specific add-ons.

## Temporary & just-in-time access
- **`expires_at` on both grant tables** (`role_assignment` and `resource_acl`) — a time-boxed role, workspace elevation, or share uses the exact same model as a permanent one. Evaluation treats expired rows as absent immediately (checked in the cached snapshot's validity window); a background sweeper hard-deletes them, emits revocation events (cache invalidation + audit), and notifies grantee/grantor shortly before expiry.
- **Use cases baked in:** contractor/workspace guest access ("Editor until 2026-09-30"), incident break-glass, temporary cover while someone is on leave (pairs with approval delegation).
- **Just-in-time elevation via the approvals engine:** `access.elevation_request` ships as a registered approvable action — a member requests role X (org- or workspace-scope) for duration D; on approval the executor writes the assignment *with* `expires_at`. Auto-revocation is structural, not a manual cleanup task. Recommended policy for `admin_override`-class roles.

## User roles (direct assignments) — layering recap
A single user's effective access is the union of: direct **user-principal** role assignments (org and workspace scope, permanent or expiring) + **team-derived** assignments (incl. ancestor-team grants) + per-record **ACL grants** — evaluated through the four layers above, all explainable via `?explain=`. Custom org roles, system roles, and platform (admin) roles remain as previously specified; nothing about individual-user assignment changed — teams and ACLs are additional grant *sources*, not replacements.

## Approvals engine
A generic, registry-driven maker/checker workflow — not a BPMN designer. Sensitive actions are captured as pending commands and executed only after approval.

- **Approvable action registry:** modules and inheriting projects register action keys (`member.role_assign`, `billing.plan_change`, product-defined ones like `expense.submit`) with a payload schema, a human-readable renderer, and an **executor** handler. Core ships with a small set wired but *policies off by default* — the shell adds capability, each org/project opts in.
- **Policies governing policies (four-eyes):** the governance actions themselves — `settings.change` (org-scope security settings), `role.update`, `approval_policy.change` — ship as registered approvable actions. An org can therefore require a second admin's approval to change MFA enforcement, edit a role, or weaken an approval policy. Off by default; turning it on is just another approval policy. (Bootstrap rule: the policy *enabling* four-eyes can't be removed by a single admin once set — that change routes through the approval it created.)
- **Approval policies** (per org, per action): condition seam (JSONB predicate over payload, e.g. amount thresholds — evaluated by the action's module), and 1..N **sequential steps**, each with:
  - approver strategy: `manager` | `manager_chain(n)` | `team_lead(of requester)` | `role_holders(role)` | `named_users[...]` | `permission_holders(perm)`;
  - quorum: `any` | `all` | `n_of_m`;
  - expiry + escalation (after T: escalate up the chain or notify admins).
- **Lifecycle:** requested → per-step pending → approved | rejected | cancelled | expired. Approvers resolved and **snapshotted** at request time (later org-chart changes don't reroute in-flight requests). Self-approval blocked by default (policy flag to allow). **Delegation:** an approver can delegate to another user for a date range (out-of-office).
- **In-flight edge rules:** requester removed from org → request auto-cancels; policy edited/disabled → in-flight requests continue under their snapshot (admins may cancel explicitly); an approver removed from the org drops out of the snapshot (quorum re-evaluated, escalation if a step empties).
- **Execution:** on final approval the executor runs the captured command as `system on_behalf_of requester`, **re-validating permissions and preconditions at execution time** (state may have changed). Failures surface back on the request.
- **Integrations:** every transition emits domain events → audit-logs (full decision trail) and notifications (approver inbox alerts, requester outcome); expiry/escalation via background-jobs.

## Data model (schema `perm`)
`role` (org_id nullable — null = system template, name, is_system), `role_permission` (role_id, permission), `permission` (registry-seeded), `role_assignment` (principal_type, principal_id, scope_type, scope_id, role_id, granted_by, expires_at?, created_at — unique on the tuple), `resource_acl` (org_id, resource_type, resource_id, principal_type, principal_id, access_level, granted_by, expires_at?, created_at — unique on resource+principal; index (resource_type, resource_id) and (principal_type, principal_id)), `field_policy` — none (code-declared, not stored), `approval_action` (registry-seeded), `approval_policy` (org_id, action_key, condition JSONB, enabled), `approval_policy_step` (policy_id, order, strategy, strategy_config, quorum), `approval_request` (org_id, workspace_id?, action_key, payload JSONB, requester_id, status, expires_at), `approval_step_instance` (request_id, order, status, approvers snapshot), `approval_decision` (step_instance_id, approver_id, decision, comment, decided_at), `approval_delegation` (org_id, from_user, to_user, starts_at, ends_at).

## Endpoints (`/api/v1`)
- permissions (registry), roles (CRUD custom), role-assignments (grant/revoke with optional `expires_at`, list by principal/scope), me/permissions (+ `?explain=`).
- resources/{type}/{id}/acl (list/grant/revoke/change-level, requires `manager` level or module admin permission; grants accept `expires_at`), resources/{type}/{id}/visibility (put).
- access/elevation-requests (JIT elevation — thin wrapper over the approvals engine).
- teams data endpoints live in tenancy; this module adds team-as-principal assignment endpoints only.
- org-chart (tree, member chain, direct reports; write = set manager, `members.manage`).
- approvals: policies CRUD (`approvals.manage`), requests (create is implicit via guarded actions; list mine / to-decide), requests/{id} (detail, approve, reject, cancel), delegations (CRUD own).

## Frontend
- Roles & members admin UI (assign roles to users *and teams*, per org/workspace), `useCan()` / `<Can>` unchanged.
- Teams management UI (create, nest, members, leads) + team picker components.
- Org chart view (tree, edit reporting line with `members.manage`).
- **Approvals inbox** (to-decide list with payload rendering, approve/reject with comment), my-requests view, policy configuration screens.

## Rules & guardrails
- `Owner` role: full permission set, cannot be edited/deleted; last-owner protection (tenancy rule) now also blocks removal via team-assignment changes.
- All assignment, team, org-chart, policy, and decision changes emit events → audit-logs; caches invalidated off the same events.
- Approval requests are tenant-scoped rows like everything else; approvers must still hold `approvals.decide` at decision time.

## Explicit non-goals
ABAC/attribute rule engines, deny/negative permissions, parallel DAG workflows or a visual workflow builder, matrix-org multiple managers (single `manager_id`; inheriting projects can add a secondary-line table if truly needed), runtime-configurable field rules, column-level encryption, public link sharing (schema-ready, not built).

## Milestones
1. Permission registry + policy infrastructure + architecture test.
2. System roles + `role_assignment` (user principals) + evaluation + cache + explain endpoint.
3. Teams as principals (transitive membership evaluation) + custom roles CRUD + UI.
4. Workspace-scoped assignments + org chart (manager lines, tree endpoints, UI).
5. Resource ACLs: `IResourceAuthorizer` + grant table + SQL predicate + sharing UI, with file-uploads as the reference integration; admin-override auditing.
6. Temporary grants: `expires_at` end-to-end (evaluation, sweeper, pre-expiry notification).
7. Field policies: response shaping + write guard + OpenAPI/TS contract, with one reference field (member profile PII).
8. Approvals: registry + policies + request lifecycle + inbox UI (single-step, `any` quorum).
9. Approvals: multi-step, quorum, expiry/escalation, delegation; JIT elevation action.
