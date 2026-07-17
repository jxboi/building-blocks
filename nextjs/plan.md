# Plan — Next.js Frontend Shell

## Purpose
The web application shell every inheriting project builds on: layout, routing conventions, API client, auth session handling, design system, and the page scaffolding for all core modules (auth screens, org/workspace switcher, settings, admin console).

## Decisions
- **Next.js App Router**, TypeScript strict mode, `src/` layout, Turbopack.
- **Styling:** Tailwind CSS + shadcn/ui as the component base; CSS variables for theming (light/dark from day one).
- **State:** Server Components by default; TanStack Query for client-side server state; no global client store unless a feature demands it.
- **Forms:** react-hook-form + zod schemas shared with API contract types where possible.
- **API access:** generated typed client from the .NET OpenAPI spec (`openapi-typescript` + thin fetch wrapper). No hand-written endpoint URLs in components.
- **Auth session:** httpOnly cookie carrying the refresh token, access token held in memory server-side via a BFF route-handler proxy (`/app/api/proxy/[...path]`). The browser never sees raw JWTs.
- **Mobile-parity rule (architecture test-worthy):** the BFF is a *transport adapter* — cookie↔token translation, header stamping, streaming relay — and **never business logic, validation, or data shaping**. Anything a Next route handler computes beyond that is invisible to a future mobile client and therefore forbidden; the API must be the complete product on its own. Deep links use the app's route map as the canonical scheme so notification/webhook targets translate to mobile universal links mechanically.
- **i18n:** next-intl wired from the start with `en` as the only locale; keys mandatory (no hardcoded UI strings).
- **Security headers from day one:** strict CSP (nonce-based scripts, no `unsafe-inline`, `frame-ancestors 'none'`), HSTS, `X-Content-Type-Options`, referrer policy, permissions policy — set in middleware, verified by a Playwright check so they can't silently regress.

## Structure
```
apps/web/
├── src/app/
│   ├── (auth)/          login, register, forgot-password, invite acceptance
│   ├── (app)/           authenticated shell: sidebar, org/workspace switcher
│   │   ├── [workspace]/ workspace-scoped product pages
│   │   └── settings/    profile, org, members, billing, api-keys
│   ├── (admin)/         admin console (see admin-console/plan.md)
│   └── api/             BFF route handlers (auth proxy, uploads presign relay)
├── src/components/      ui/ (shadcn), layout/, domain/
├── src/lib/             api-client, auth, feature-flags, analytics seams
└── src/styles/
```

## Navigation & information architecture
- **Nav registry (the frontend's module-registration pattern):** sidebar and settings navigation are assembled from registered nav items — `{ label key, icon, href, feature key, scope: workspace | org | user }`. Core modules register their entries (settings pages, approvals, reports…); product features append theirs; items auto-resolve through `useFeature(key)` (flag ∧ entitlement ∧ org toggle ∧ permission — feature-flags plan) and hide or render an upgrade state accordingly. Nobody edits the sidebar component to add a page.
- **Layout:** left sidebar (workspace-scoped product nav + pinned items) with org/workspace switcher at top and user menu at bottom; slim top bar per page (breadcrumbs, page actions, search trigger, notification bell). Admin console has its own sidebar built from the same registry mechanism (admin sections registry, per admin-console plan).
- **Breadcrumbs** derive from the route segments + entity labels (typed helper per route — no string parsing).
- **Menus:** user menu (profile, theme, locale, sessions, sign out), switcher (orgs → workspaces, with create/invite entry points), per-entity context menus built on one dropdown component with actions filtered by `useCan` — same convention everywhere.
- **Command palette (⌘K)** doubles as navigation: registered nav items + search results (search plan); this is the mobile-friendly escape hatch for deep pages too.
- **Keyboard shortcuts registry:** one provider owns bindings (⌘K, g-then-x navigation chords, ? for shortcut help overlay); features register — no scattered `addEventListener`s.

## Route map (shell sitemap)
```
(auth)    /login /register /forgot-password /reset-password /verify-email /invite/[token] /mfa
(app)     /                                → redirect to last-active workspace
          /[workspace]                     → product home (dashboard kit)
          /[workspace]/search /notifications /messages /approvals /reports
          /settings/profile|security|sessions|notifications|preferences|feedback  (user scope)
          /settings/organisation|members|teams|roles|billing|usage|audit
                   |api-keys|webhooks|connections|schedules                     (org scope)
(admin)   /admin + /admin/users|organisations|audit|flags|email|jobs|billing|settings
misc      /403 /404 /error /demo (entry, when demo mode on)
```
Product pages live under `/[workspace]/...`; the map above is the stable shell contract — inheriting projects extend, don't rearrange.

## Interaction states (conventions, enforced in review)
- **Loading:** route-group `loading.tsx` with **skeletons that match the final layout** (no spinner-only pages, no layout shift); Suspense streaming for slow sections; a thin top progress bar for route transitions; button-level pending states (spinner-in-button, disabled) for mutations only.
- **Data freshness:** TanStack Query stale-while-revalidate with three declared `staleTime` tiers — *reference* (5 min: permissions set, flags, settings, plan catalogue), *content* (30s: lists, entities), *live* (0: notifications, usage counters) — set in the query-key factory, not per call site; **optimistic updates** for cheap reversible mutations (toggles, read-states), rollback on error via the standard toast.
- **Rendering/caching posture:** everything under `(app)`/`(admin)` is dynamically rendered (authenticated, tenant-scoped — no ISR/static caching of tenant data); Next.js hashed static assets are immutable + CDN-cacheable; the BFF proxy forwards the API's `no-store` semantics untouched.
- **Empty states:** every list/collection ships one (illustration slot, one-line explanation, primary CTA) — a shared `EmptyState` component; "no results" ≠ "no data yet" ≠ "no permission" (three distinct variants).
- **Error states:** per error-handling plan (boundaries, field errors, 403 component, correlation ID surface).
- **Destructive actions:** shared confirmation dialog; name-typing confirmation for the irreversible tier (org delete), consistent with API-side rules.

## Messaging surfaces (one hierarchy, no improvisation)
Five tiers, each with one component and a rule for when it's the right one:
1. **Tooltip** (Radix): supplementary hints only — never load-bearing content (touch users may never see it); mandatory on icon-only controls; 300ms delay; shows on keyboard focus, not just hover.
2. **Inline alert**: contextual, lives *in* the content flow (form-level warnings, empty-state variants, degraded-widget fallbacks) — severity-styled (info/warning/error), never auto-dismisses.
3. **Toast**: transient feedback about *an action just taken* (saved, failed, undo) — auto-dismiss, queued, never used for persistent conditions.
4. **Banner**: persistent app/page-level conditions, rendered in a **single stacked banner slot** with fixed priority order: impersonation > payment failed/read-only > demo mode > version-refresh prompt > platform announcement > degraded service. Max 2 visible (rest collapse into an indicator); per-banner dismissal rules (impersonation: never; announcement: per-user dismissible).
5. **Modal/dialog**: blocking decisions only (confirmations, conflict resolution) — never marketing, never announcements.

## Version skew (deploys vs open tabs)
Every response carries a `X-Build-Id` header (injected at image build, docker-deployment plan); the client compares it to its bundled id — on mismatch, a low-priority **refresh banner** appears ("A new version is available — Refresh"), escalating to a blocking prompt only if a mutation fails with a contract-mismatch error. Never force-reload over unsaved work (form-draft persistence covers the refresh). API additive-versioning (`/api/v1`) means skew is almost always tolerable — the banner is hygiene, not a crutch.

## Images (loading + uploading conventions)
- **One `<Img>` wrapper** over `next/image` with a custom loader mapping to the file module's variant URLs (Next's own optimizer stays off for private images — variants are pre-generated server-side). It enforces: explicit dimensions/aspect-ratio (zero CLS), lazy loading below the fold (`priority` only for LCP images), LQIP blur placeholder from the file row, `sizes` derived from the layout slot. Raw `<img>` fails lint outside this component.
- **Upload kit component:** drag-drop + paste + file picker, multi-file, per-file progress (direct-to-storage PUT progress events), client-side downscale/re-encode per the purpose contract (file-uploads plan), retry per file, and the standard pending/quarantine states rendered from file status. Avatars get the cropper variant of the same kit.
- Static/brand assets stay on Next's hashed immutable pipeline — the kit is for user content only.

## Filter kit (customisable list filtering)
- **Declarative per list:** each list/table declares its filters as typed definitions — `enum` (status, type), `entity` (person/team picker), `date-range`, `boolean`, `text` — and the shared filter bar renders them: add-filter menu → chips with inline editing → clear-all. Server-side filtering only (definitions map to query params of the list endpoint); the client never filters a partial dataset.
- **URL is the filter state:** active filters serialize to query params — shareable/bookmarkable views, back-button friendly, SSR-consistent. Component state never diverges from the URL.
- **Saved views (per user):** name the current filter+sort combination; stored via the settings registry (user scope, keyed by list id — no new table, no sharing). Org-shared saved views are a deliberate non-goal until a product needs them.
- Consumers from day one: members list, audit log, files, notifications, admin lists — the kit is proven on shell lists before products inherit it.
- **Export view:** every filter-kit list carries an "Export…" action handing the current facets/sort/columns to the reports pipeline's generic list export (reports plan) — the filtered view *is* the report definition.

## Menu & popup conventions
- **One primitive family** (Radix via shadcn: `DropdownMenu`, `Popover`, `Tooltip`, `ContextMenu`) — no third-party menu libs, no hand-rolled positioning. Mobile: menus and popovers become bottom sheets (per responsive rules).
- **Rules:** max one submenu level; destructive items styled distinctly, placed last, separated, and always route through the confirmation dialog (never destructive-on-click from a menu); every item = icon + label (no icon-only menu items); disabled-with-tooltip-why over hidden when the user *could* gain the ability (upgrade/permission CTA), hidden when they never can.
- Right-click `ContextMenu` mirrors the row's "⋯" menu on data tables — same action list from the same `useCan`-filtered source, defined once per entity.

## State-change conventions
- **Status is rendered from API enums, once:** a `StatusBadge` component maps generated enum types → label key + color + icon (shape+icon, never color alone — a11y). New statuses fail the exhaustiveness check at compile time rather than rendering blank.
- **Mutations:** optimistic for cheap reversible changes with **undo toast** where the API supports inverse (archive, read-state, assignment); pending-button + refetch for everything else; on success, invalidate the affected TanStack Query keys via a per-entity key factory (one file — no ad-hoc string keys).
- **No live multi-user sync (non-goal):** the SignalR hub carries notifications only; lists stay fresh via TanStack refetch-on-focus + intervals on hot views. Real-time collaboration is a product decision with its own cost; the shell doesn't fake it halfway.
- Transitions animate subtly (150–200ms, `prefers-reduced-motion` respected); no confetti-tier effects in the shell.

## Iconography
- **Single library: Lucide** (shadcn's default) — no mixed icon sets, no ad-hoc inline SVGs; product-specific icons live in one `icons/` directory as typed components following Lucide's grid/stroke conventions.
- **Sizes are tokens** (16 inline/menu, 20 buttons/nav, 24 page-level); stroke width consistent; icons inherit `currentColor` so themes work automatically.
- **Icon-only controls always carry a tooltip + `aria-label`;** nav/menu items are always icon+label. Entity types get a canonical icon each (registered alongside nav/search registrations — the same icon everywhere the entity appears: nav, search results, notifications, breadcrumbs).

## Responsive & mobile
- **The app is fully responsive; there is no native app** (existing non-goal). Strategy: desktop-first layouts that collapse deliberately — sidebar → hamburger drawer, top bar condenses, tables → row-cards on small screens (the data-table component owns this, per-column priority hints), dialogs → bottom sheets, 44px touch targets.
- **Tested breakpoints:** the Tailwind defaults; Playwright smoke runs key flows at mobile width (375px) so responsive regressions fail CI, not field reports.
- **Admin console is desktop-optimised** (usable, not polished, on mobile) — operators use laptops; don't spend the effort there.

## Accessibility (baseline, not afterthought)
- **WCAG 2.2 AA target**, largely inherited from Radix primitives under shadcn/ui — the discipline is not breaking it: visible focus rings (token-based), full keyboard reachability (the shortcuts registry helps), form inputs always labelled, `prefers-reduced-motion` respected, contrast-checked theme tokens (both modes).
- Automated axe checks inside Playwright smoke on core pages; manual screen-reader pass on the auth + settings flows once per phase.

## Contracts with other modules
- **error-handling:** global `error.tsx` + `not-found.tsx`; ProblemDetails parser converts API errors to typed `ApiError`; toast + inline-field error conventions.
- **authentication:** login/register/refresh flows against the API; middleware guards `(app)` and `(admin)` groups.
- **organisations-workspaces:** context provider exposing current org/workspace; switcher in shell layout; workspace slug in URL.
- **roles-permissions:** `useCan(permission)` hook + `<Can>` component; UI hiding is convenience only — server enforces.
- **feature-flags:** `useFlag(key)` hook backed by a flags endpoint, evaluated server-side per request where SSR needs it.
- **notifications:** SignalR client, notification bell, unread counts.

## Non-goals
Marketing/landing pages, native apps, complex client caching strategy beyond TanStack Query defaults.

## Milestones
1. Scaffold app, Tailwind, shadcn, layout shell, dark mode.
2. BFF auth proxy + session handling + route guards.
3. Typed API client generation in CI.
4. Org/workspace shell (switcher, settings pages skeleton).
5. Nav registry + sidebar/topbar + switcher + user menu + breadcrumbs + route map.
6. Shared patterns: data table (incl. mobile row-cards), form kit, empty states, skeletons, toasts, confirmation dialogs, filter kit + saved views, StatusBadge + query-key factory.
7. Command palette + keyboard shortcuts registry.
8. Responsive pass + mobile-width Playwright checks + axe baseline.
9. Dashboard kit (see below).

## Dashboard kit (developer-built dashboards, not a dashboard engine)
Standard pieces for product/admin dashboards so inheriting projects assemble instead of reinvent:
- **Charting: Recharts** via the shadcn/ui chart components (one library, themed by the same CSS variables — light/dark for free).
- **Components:** `StatTile` (value, delta, spark-line), `TimeSeriesChart`, `BarList`/breakdown, `DateRangePicker` (presets + org-timezone aware), dashboard grid layout, and matching loading/empty/error states.
- **API convention:** dashboards consume **server-aggregated, typed endpoints** (`/api/v1/.../stats?from=&to=&bucket=`) returning pre-bucketed series — never raw rows aggregated client-side. Bucketing respects the org's timezone (`org_setting`). Each feature ships its own stats endpoints; there is no generic metrics-query API (that's the rejected BI engine).
- **Consumers:** admin console dashboard is the reference implementation; product dashboards in inheriting projects use the same kit.
- **Non-goals:** user-configurable layouts/widgets, saved custom charts, cross-entity ad-hoc queries.

## Removal/extension notes for inheriting projects
Product pages live under `(app)/[workspace]/`; core shell files should not need edits. Theme tokens in one file; brand swap is a token + logo change.
