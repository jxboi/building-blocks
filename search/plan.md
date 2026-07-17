# Plan — Search

## Purpose
Unified, tenant-scoped search across entities (members, workspaces, files, product entities) with a pluggable backend: PostgreSQL full-text by default, swappable to OpenSearch when scale demands — without changing callers.

## Decisions
- **Abstraction first:** `ISearchIndex` (index/update/delete document, query with filters/facets/pagination) + `ISearchable` registration per entity type. Callers depend on the abstraction only.
- **Default backend: Postgres.** A single `search.document` table: `tsvector` column (weighted: title A, body B, tags C) + `pg_trgm` index for fuzzy/prefix matching; ranking via `ts_rank` blended with recency (+ per-type boosts declared at registration). Good to hundreds of thousands of docs per org — plenty for a starter shell.
- **Query parsing:** `websearch_to_tsquery` — users get familiar syntax (quoted phrases, `-exclusion`, `OR`) with no crash-on-bad-input; short/no-hit queries fall back to trigram prefix matching, which also provides typo tolerance.
- **Language:** FTS config is a deployment setting (default `english`); the trigram index is language-agnostic, so non-English content still matches without stemming. Per-org language and multilingual stemming are explicitly deferred to the OpenSearch adapter — not solved in the Postgres backend.
- **Snippets:** results include a highlighted fragment via `ts_headline` (bounded length), generated only for the returned page — never for the full candidate set.
- **OpenSearch adapter** planned as a drop-in second implementation (same interface, config switch); not built until a project needs it, but the interface is designed against both from day one (no Postgres-only concepts leak through). **Switch triggers** (documented, not vibes): sustained p95 search latency above ~300 ms with tuned indexes, multi-million-document orgs, or a hard requirement for multilingual stemming/synonyms.
- **Indexing pipeline:** domain events (`EntityCreated/Updated/Deleted` or module-specific) → outbox → indexer job upserts documents. Async by design; UI never blocks on indexing. Full-reindex command per entity type for rebuilds/backfills.
- **Tenancy & permissions:** every document carries `organisation_id` (+ `workspace_id?`); queries always filter by caller's org. Fine-grained result-level permission (e.g. private files) handled via a `visibility` field on the document + a post-filter that delegates to `IResourceAuthorizer` (roles-permissions plan) for ACL-controlled types — private records never appear in another user's results. Field-policy-guarded fields are never indexed (documents store the unrestricted projection only).
- **Post-filter × pagination rule:** the engine **overscans** (fetches a multiple of the page size, batch-authorises, refills until the page is full or candidates exhausted) and cursors point at the last *authorised* hit — a page is never silently short because results were filtered out, and total counts are shown as "10+" rather than exact (exact counts under post-filtering cost a full scan; not worth it).
- **Archived workspaces** are excluded from default scope (tenancy plan rule); an explicit `include_archived` filter opts back in.
- **Registration pattern:** each searchable entity declares type key, document mapper, and event subscriptions; inheriting projects add entities by registering, not by editing the search module.

## Data model (schema `search`)
`document` (entity_type, entity_id, org_id, workspace_id?, title, body, tags, visibility, tsv tsvector generated column, updated_at; PK (entity_type, entity_id)).

## Endpoints (`/api/v1`)
search (q, types[], workspace?, cursor — grouped-by-type results for the omnibox), search/reindex (admin-only, async).

## Frontend
Global command palette (⌘K) hitting the grouped endpoint with debounce; type-filtered full results page.

## Baseline indexed types
workspace, member (name/email), file (name/metadata). Product entities join via registration.

**File-content seam (off by default):** the shell indexes file *metadata* only. An `IContentExtractor` hook (background job: extract text from PDF/Office docs on `FileStored`, feed the document body) is designed but not built — turning it on is an inheriting-project decision with its own cost/size trade-offs.

## Removal notes
Optional module: delete folder + registrations; command palette degrades to client-side navigation search.

## Milestones
1. Interface + Postgres backend + document table.
2. Event-driven indexing via outbox + reindex command.
3. Search endpoint + command palette UI.
4. Visibility/post-filter pattern + docs.
