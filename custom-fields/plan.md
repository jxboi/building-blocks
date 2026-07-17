# Plan — Custom Fields, Tags & Entity Rules

## Purpose
Org admins extend supported entities from the frontend — no deploys, no schema changes — with three composable capabilities:
1. **Custom fields** (stored per-entity values), 2. **Derived fields** (computed from existing data, e.g. `contract_expiry = joined_at + 1 year`), 3. **Tags + entity rules** (admin-defined classification logic, e.g. *"member inactive > 1 year → auto-tag 'Inactive'"*).
This is the sanctioned answer to "we need extra fields / statuses / lifecycle logic per customer" that otherwise breeds `misc` columns, hardcoded statuses, or per-customer forks — while staying deliberately short of the rejected automation engine.

## Decisions

### Hosting model (opt-in per entity)
- Entities register as **custom-field hosts** (`ICustomFieldHost`): host declares its entity key, its bindable **source fields** (system fields safe to derive from — e.g. member: `joined_at`, `email`; task: `created_at`, `due_date`, `priority`), and where the fields render. Baseline hosts: organisation member, organisation, task (tasks plan already points here).
- **Storage: one `custom_fields JSONB` column** on each host table (opt-in migration per host) + GIN index — *not* reserved misc columns (arbitrary cap, untyped, unnamed) and *not* an EAV table (join soup). Values validated against definitions on every write.

### Definitions (org-scoped, admin-managed)
`custom_field_definition`: entity key, field key, label, description, **data type** (`text | number | date | boolean | select (options) | user`), required, default, validation (min/max/regex/length), position, **visibility** (`member | admin` — reuses the audit-tier idea; admin-only fields are stripped for regular members via the same response-shaping path as field policies), archived_at. Per-entity cap (default 30, settings registry) so the escape valve doesn't become the schema.

### Derived fields (the deliberately small computation model)
A definition may be `derived` instead of stored — defined by picking, in the UI: **source field → operation → parameters**. The operation set is a closed, typed catalogue — **not a formula language**:
- date → `add interval` (± N days/months/years — covers the expiry example), `extract` (year/month)
- number → `add / multiply by constant`, `difference between two number/date sources` (e.g. days between)
- text → `template` (concat of sources + literals)
- any → `map` (select-style bucketing: value ranges → labels)
- **Materialised, not computed-on-read:** the resolved value is written into the same JSONB (a) on entity save when a source changed (interceptor), (b) by a backfill job when a definition is created/edited. So derived values are filterable, sortable, exportable, and PDF-bindable exactly like stored ones, and they update deterministically when their source updates. Consequence (documented): sources must be *entity fields*, never `now()` — "days until expiry" is UI formatting over a stored date, not a stored moving value.
- Chaining allowed one level (derived-from-derived blocked — keeps recompute topology trivial).

### Where custom fields appear (free, via existing kits)
Form kit auto-renders them (definition → field component, validation client+server); data-table columns + **filter kit facets** (typed filters from definitions); entity detail panels (registered section); **exports/reports** include them; **document-templates data-source registry** exposes them (`member.custom.contract_expiry` bindable straight into a PDF — the two modules compose); search indexes text-type custom fields per host opt-in.

### Governance
Definition changes require `custom_fields.manage`, are audited, and can be approval-gated like any governance action. Deleting a definition archives it (values retained, hidden) — hard purge is an explicit second step. Demo/seed profiles include a derived-field example (the expiry scenario, precisely).

## Tags (generalised, host-based)
- Org-scoped **tag** registry per host entity (name, color, description) + `entity_tag` assignments. Manual tagging by members with the host's edit permission; tags render everywhere the kits reach (tables, detail panels, **filter kit facets**, exports, search).
- Assignments record their origin: `manual` or `rule:{id}` — **rules only manage their own assignments** (a rule un-tags when its condition stops matching, but never touches a manually applied tag of the same name).

## Entity rules (admin-defined classification logic — the closed-catalogue automation)
- **Rule = host entity + condition + actions + evaluation mode**, built entirely in the frontend:
  - **Condition:** ANDed predicate list from a closed catalogue over the host's registered source fields *and custom fields*: comparisons (`= ≠ > < in empty`), and **relative-time predicates in both directions** — past-relative (`date field older/newer than N days/months/years` — "inactive > 1 year") and future-relative (`date field within / more than N days away` — "expires within 30 days"). `now()` belongs in *scheduled evaluation*, not in stored derived values.
  - **Actions (closed catalogue), in two semantic classes:**
    - *State-maintaining* (applied while matching, reverted when not): add/remove tag · set a custom field value.
    - *Edge-triggered* (fired **once on entering** the match set, re-armed only after the entity leaves it): notify an audience (role / team / the entity's watchers where the host has them — delivered as inbox notification and/or email per recipients' channel preferences, deep-linking to the entity) · **enqueue into a queue** (*contributed by the queues module into this catalogue* — the action registry is extensible by modules, same as every registry; this module never references queues) · emit `rule.matched` domain event (markable external → webhook bridge).
  - **Match-state memory:** `rule_match` (rule_id, entity_id, matched_at, cleared_at) tracks membership so edge actions are exactly-once per episode and survive sweep restarts — a contract "expiring in 30 days" reminds the team once, not daily for a month; if it's renewed (leaves the set) and later approaches expiry again, the rule re-arms and reminds again. Escalation ladders ("again at 7 days, again at expiry") are simply additional rules with tighter windows.
  - **Evaluation:** default **daily sweep** (background job; conditions compile to SQL predicates, evaluated set-wise per rule — no per-entity loops) + opt-in **on-change evaluation** for rules that should react immediately to entity saves. Both paths idempotent.
- **Safety rails (what keeps this from becoming the rejected engine):**
  - **No chaining:** rule actions never trigger other rules (single-pass; a rule-set tag/field is invisible to other rules' conditions during the same sweep) — no cascades, no loops, no ordering debates.
  - **Dry-run first:** the builder shows *"this rule currently matches 132 members"* with a sample list before enabling — the difference between a tool and a foot-gun.
  - Rule executions are audited (`actor: system, on_behalf_of rule:{id}`), rules are capped per org (settings), `rules.manage` permission, approval-gatable like other governance actions, and disabled automatically with an admin notification if a sweep errors repeatedly.
- **Boundary (recorded):** conditions read only the entity's own registered fields — no cross-entity lookups, no external data; actions never call external services directly (the `rule.matched` → webhook bridge is the escape). Event-triggered arbitrary workflows remain the rejected product vertical.

## The worked example (from the requirements)
Member host registers `last_active_at` as a source → admin builds rule *"Inactive members"*: condition `last_active_at older than 365 days` → actions: add tag `Inactive`, notify org admins → dry-run shows matches → enable. The daily sweep tags/untags as members cross the threshold; the tag is filterable in the member list, appears in exports and reports, and — because tags are registered filter facets — "all inactive members" becomes a saved view. Member becomes active again → next sweep removes the rule-managed tag automatically.

## Data model (schema `custom`)
`custom_field_definition` (as above; unique (org, entity, key)), values live on host tables' `custom_fields` JSONB; `tag` (org, entity_key, name, color), `entity_tag` (tag_id, entity_id, origin: manual|rule_id), `entity_rule` (org, entity_key, name, condition JSONB, actions JSONB, mode: sweep|on_change, enabled, last_sweep_at, error_streak), `rule_match` (rule_id, entity_id, matched_at, cleared_at — edge-action memory), `backfill_run` (definition/rule id, status, progress).

## Endpoints (`/api/v1`)
custom-fields/{entity} (definitions CRUD, reorder, archive), plus values ride the host entities' own endpoints (validated centrally by the host registration).

## Frontend
Org settings → Custom fields per entity: definition list, editor (type-specific config), **derived-field builder** (source picker → operation picker → params → live preview against a sample record), backfill progress. Rendering in forms/tables/detail comes from the kits.

## Non-goals (each recorded with its escape path)
Formula language / user-defined expressions (the operation catalogue *is* the language; a genuine formula need = product decision with a sandboxed evaluator), cross-entity lookups/rollups (product vertical territory), per-workspace definitions (org-level only until a real need), computed-on-read "live" values (UI formatting covers it), custom field *types* plugged in at runtime (products register new operations/types in code — registry, as ever).

## Milestones
1. Host registration + definitions + JSONB storage + validation + form/table/filter rendering (stored types only).
2. Derived fields: operation catalogue, interceptor recompute, backfill job, builder UI with preview.
3. Tags: registry, assignments, kit rendering, facets.
4. Entity rules: condition/action catalogues, SQL-compiled sweep, dry-run builder, on-change mode, audit + auto-disable.
5. Visibility shaping, exports/reports/search/document-templates integration.
6. Governance polish: approvals hook, archive/purge, caps, seed examples (expiry field + inactive rule).
