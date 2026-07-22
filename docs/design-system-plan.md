# Design System — Build Plan

Companion to the design-system section of [nextjs/plan.md](../nextjs/plan.md) and the nextjs closure criteria in [build-order.md](build-order.md). This is a **gap plan**: the foundation already exists in `apps/web`; the stages below close the distance to the closure criteria. When in doubt, nextjs/plan.md wins.

## Status (2026-07-22)

Stages 1–3 and 5 are **built and verified** (lint, typecheck, 61 unit tests, e2e all green). Stage 4 is deferred by design (those kits land with their consuming modules). What shipped:

- **Stage 1 — token contract:** closed 5-size type scale (`xs/sm/base/xl/2xl`) with a `no-off-scale-typography` lint rule; documented spacing subset; live WCAG contrast matrix on `/design` backed by an OKLCH→sRGB parser of `globals.css` and a unit test (`src/lib/design/contrast.ts` + `contrast.test.ts`) so a token edit that breaks AA fails CI.
- **Stage 2 — catalogue completeness + gate:** every `components/kit` component rendered from source in a registry-driven "Kit" tab; an exhaustiveness test (`catalogue-manifest.test.ts`) fails CI on any un-catalogued component; mobile axe + overflow e2e. Fixed a real a11y bug in `PageSkeleton` (roleless `aria-label`) that the catalogue surfaced.
- **Stage 3 — messaging + icons:** priority-ordered banner stack (`src/lib/layout/banners.ts` + `BannerStack`, max-2 + collapse + per-kind dismissal, tested); `notify` toast helper (`src/lib/notify.ts`) with a `no-raw-toast` lint rule and migrated call sites; typed entity-icon registry (`src/lib/icons/entity-icons.ts`).
- **Stage 5 — docs:** terminology glossary (`src/lib/design/glossary.ts`, rendered on `/design`); review checklist in the catalogue footer; expanded `CONTRIBUTING.md`.

**Type-scale decision:** the closed set is `xs`(12)/`sm`(14)/`base`(16)/`xl`(20)/`2xl`(24). This keeps the two workhorses (`sm`, `xl`) the old catalogue specimen wrongly omitted and collapses the rarely-used display tier (`3xl/4xl/5xl`, ~5 spots) into `2xl` — flat 24px page titles rather than responsive font-size bumps.

**Deliberately not done:** screenshot-snapshot visual-drift test (Playwright pixel baselines are environment-sensitive and flaky; axe + exhaustiveness + overflow cover regressions). Per-user banner-dismissal persistence (rides the settings registry when it lands; in-session dismissal works today).

## UI/UX polish pass (2026-07-22)

A polish pass drawing on Notion (warm neutral, content-first), Linear (refined type, monochrome depth, tabular numerals), and Apple (layered soft shadows, optical type, precise alignment). Done at the **token layer** so it propagates, staying disciplined about the brand-neutral monochrome identity (no accent hue introduced):

- **Elevation:** reworked `--elevation-1/2/3` into layered warm-tinted shadows (tight contact + soft ambient) and added `--elevation-card` → `shadow-xs`. Cards, buttons (default/outline/secondary), and the metric strip now lift subtly off the page instead of reading flat.
- **Typography:** optical letter-spacing (`-0.006em` body, `-0.018em` headings), `font-optical-sizing`, grayscale smoothing. Switched dashboard `StatTile` values off `font-mono` to sans + `tabular-nums` (fixes awkward "3 . 4d" / "99 . 2%" spacing).
- **Radius:** `--radius-panel` 0.625→0.6875rem for slightly softer panels while controls stay crisp.
- **Catalogue:** token swatches now show the `--variable` name with a hover elevation.

**Colour refinement:** retuned the semantic status palette in OKLCH for vividness and harmony — the biggest fix being **warning**, which read as muddy brown/olive (`0.47 0.12 75`) and is now a proper warm amber (`0.53 0.15 64`); success is fresher, info richer, destructive more vivid, with brighter dark-theme counterparts. Every value was probed against the badge/alert *text* use (colour-on-10%-tint) to stay ≥4.5:1 before applying, so the contrast test and axe still pass. Also reworked the **chart palette**: the primary series stays a confident neutral (elegant for single-series), but the second series is now a clear blue instead of a near-invisible grey, with a harmonious blue/amber/teal/violet categorical set for multi-series — both themes.

All changes verified: contrast test (37), axe e2e (10), lint, typecheck, 61 unit green — no color-contrast or a11y regressions (elevation/type changes don't touch the semantic color layer; the new status colours were contrast-verified before applying).

## Expanded control set (2026-07-22)

The primitive set had the overlay/menu family (dropdown-menu, select, popover, dialog) but no **form controls**. Added, all in `components/ui/`, Radix-backed where one exists and matching the `select.tsx` conventions (`data-slot`, the `focus-visible:ring-3 ring-ring/50` focus pattern, token-only colours):

- **checkbox** (incl. indeterminate), **radio-group**, **switch**, **toggle** + **toggle-group** (cva variants), **slider** (single + range), **button-group** (segments any-size buttons via attribute-scoped radius overrides).
- **calendar** — hand-rolled (no `react-day-picker`): a `role="grid"` month view with roving-tabindex arrow-key navigation, today marker, and **disabled** outside-month days (so they can stay faint without failing axe contrast). **date-picker** (Popover + Calendar) and **time-picker** (hour/minute selects) compose on top.

A new **Controls tab** on `/design` showcases every control in its states, both themes, each with a real label/`aria-label`. New e2e test drives the tab and runs axe over it (caught and fixed: a slider thumb needing a name, a Select combobox needing a label, and the calendar's faint outside days). The 5-tab `TabsList` is wrapped in a horizontal-scroll container so it never overflows at mobile width. Verified: lint, typecheck, 61 unit, full e2e (incl. new controls-axe + mobile-overflow) green.

## Current state (verified 2026-07-21)

Already built and working:

- **Tokens** (`src/app/globals.css`): two-layer architecture — warm-neutral primitives → semantic roles — with light/dark at the semantic layer, plus `catalogue-light`/`catalogue-dark` helpers for side-by-side theme specimens. Radius (3), elevation (3), motion (2 durations + `prefers-reduced-motion`) are closed sets.
- **`/design` catalogue**: prod-gated route rendering tokens, both-theme specimens, and a subset of kit components.
- **Lint enforcement** (`eslint.config.mjs`): five custom rules — raw `<button>/<input>/<select>/<textarea>`, raw `<img>`, arbitrary px/rem/hex bracket values, mixed icon libraries, hex colors — all `error`, exempting only `components/ui/`.
- **Kit tier** (`src/components/kit/`): confirmation-dialog, data-table (mobile row-cards), empty-state, filter-bar, form-field, img, inline-alert, page-skeleton, status-badge, table-row-actions, dashboard kit (stat-tile, time-series-chart, bar-list, date-range-picker). Banner slot exists in `components/layout/`.
- **CI checks** (`tests/e2e/shell.spec.ts`): axe on `/design` (desktop), axe + overflow at 375px on `/demo`, CSP header check.
- **Conventions doc**: `CONTRIBUTING.md` covers copy rules, state coverage, icon/tooltip/destructive-action rules.

## Gaps → stages

### Stage 1 — Close the token contract

1. **Type scale as a closed set.** The plan says 5 sizes; the codebase currently uses 6 ad hoc (`text-xs/sm/base/xl/2xl/3xl`, with `lg` unused). Decide the five (proposal: `xs`, `sm`, `base`, `xl`, `2xl`; migrate the three `text-3xl` uses to `2xl`), name them semantically in the catalogue (caption / label / body / title / display), and extend the off-scale lint rule to flag `text-*` classes outside the set.
2. **Documented spacing subset.** Components use Tailwind's scale freely today; document the allowed subset (proposal: 0.5–12 steps only) in the catalogue's token page. Lint enforcement optional — review-level is acceptable per plan, but record the decision.
3. **Contrast checks in the catalogue.** The plan requires the catalogue to render tokens *with contrast checks*. Add a small WCAG-contrast helper that evaluates every semantic fg/bg pair (foreground/background, muted-foreground/muted, primary pair, destructive pair, status colors on background) in **both themes**, renders the ratio beside each swatch, and marks < 4.5:1 failures. Add a unit test over the same pairs so a token edit that breaks contrast fails CI, not review.

### Stage 2 — Catalogue completeness + exhaustiveness gate

1. **Add the missing kit entries**: FilterBar, FormField, Img, TableRowActions, BannerSlot, and the dashboard kit (StatTile, TimeSeriesChart, BarList, DateRangePicker) — each in loading / empty / error / disabled states where the state exists.
2. **Exhaustiveness test.** A vitest test lists `src/components/kit/**` (and the catalogue-relevant `layout/` pieces) and asserts each appears in a catalogue registry. New kit component without a catalogue entry = red CI. This is what keeps the catalogue "always true" as the kit grows.
3. **Mobile-width catalogue check.** The `/design` axe test currently runs desktop-only; run it in the mobile Playwright project too, with the same horizontal-overflow assertion used on `/demo`.
4. **Visual drift (cheap version).** Playwright screenshot snapshots of `/design` in light and dark, committed, so token/kit changes show up as an image diff in review. Keep tolerance loose; this is a review aid, not a pixel gate.

### Stage 3 — Remaining zero-dependency pieces

1. **Banner slot hardening.** The component exists; verify and test the plan's rules — fixed priority order (impersonation > payment > demo > version-refresh > announcement > degraded), max 2 visible with collapse indicator, per-banner dismissal rules. Demo mode and the version-skew refresh banner are usable consumers today.
2. **Toast conventions.** Sonner is installed; wrap it in one module exporting the sanctioned variants (success / error-with-correlation-ID / undo) so call sites can't improvise. Catalogue entry included.
3. **Icon registry.** `no-mixed-icon-libraries` blocks foreign sets, but there's no `icons/` directory or entity-icon registry yet. Create the typed registry (entity → Lucide icon) so nav/search/notifications resolve the same icon per entity, per plan.

### Stage 4 — Deferred kits (build with their consuming module, not now)

These tier-2 kits have no real consumer yet; building them speculatively violates the repo's registry-over-guesswork discipline. Sequence them with their modules and require the catalogue entry + axe pass **in the same PR** (the Stage 2 exhaustiveness test enforces this automatically):

| Kit | Lands with | Phase |
|---|---|---|
| People/team picker | organisations-workspaces | 2 |
| Sharing dialog | roles-permissions (ACLs) | 2 |
| ActivityFeed | audit-logs | 3 |
| Upload kit + avatar cropper | file-uploads | 3 |
| Schedule editor | background-jobs remainder | 3 |
| Saved views (filter kit extension) | first shell list consumer (members list) | 2 |

### Stage 5 — Docs & glossary

1. **Terminology glossary** beside the tokens (one name per concept — "workspace" never "project"); `CONTRIBUTING.md` references the canonical term but the glossary itself doesn't exist yet.
2. **Review checklist linkage**: confirm `CONTRIBUTING.md` covers the full checklist from the plan (messaging-surface hierarchy, disabled-vs-hidden, icon+label, skeleton-matching) and link it from the catalogue page footer so it's one click away during review.

## Closure (maps to build-order nextjs bullets)

- [ ] Token architecture with light/dark **and contrast checks rendered in the catalogue** (Stage 1).
- [ ] `/design` renders **every** token and kit component in all states, both themes, mobile width — enforced by the exhaustiveness test and mobile axe run (Stage 2).
- [ ] Lint rules active including the closed type scale (Stage 1).
- [ ] Playwright axe baseline + mobile-width checks green, including `/design` (Stage 2).
- [ ] Deferred kits tracked against their phases with the same-PR catalogue rule recorded (Stage 4).

## Suggested order & sizing

Stages 1–3 are independent of every other module and small: Stage 1 ≈ a day (the type-scale migration is the only code churn), Stage 2 ≈ a day, Stage 3 ≈ 1–2 days (banner rules + tests dominate). Do them in order — the Stage 2 exhaustiveness gate should exist before Stage 3 adds components, so the gate proves itself immediately. Stage 4 is sequencing, not work; Stage 5 is an afternoon.
