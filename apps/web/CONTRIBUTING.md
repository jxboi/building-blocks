# Frontend conventions

- Use Server Components until a leaf needs state, browser APIs, or event handlers.
- Put visible copy in `messages/en.json`; use sentence case and the canonical term for each concept from the glossary (“workspace”, never “project”). The glossary lives in `src/lib/design/glossary.ts` and renders on `/design`.
- Add navigation through the registry. If a feature requires editing the sidebar, the registration seam is incomplete.
- Consume semantic tokens (`background`, `card`, `muted`, `primary`, status roles). Raw palette values stay in `globals.css`.
- Stay on the scales: five type sizes (`text-xs`, `text-sm`, `text-base`, `text-xl`, `text-2xl`) and the documented spacing subset. Off-scale sizes and arbitrary pixel values fail lint.
- Compose `components/kit` before reaching directly for a primitive. Never use raw `button`, `input`, `select`, `textarea`, or `img` in product code.
- Every collection has loading, empty, no-results, no-permission, and error states. Skeletons match the final shape.
- Pick the right messaging surface: tooltip (supplementary hints), inline alert (in-flow conditions), toast (feedback on an action just taken), banner (persistent app-level conditions, via the priority-ordered slot), modal (blocking decisions only).
- Fire toasts through the `notify` helper (`@/lib/notify`), never `sonner` directly (lint-enforced).
- Icon-only controls require an accessible name and tooltip. Destructive menu actions must open the shared confirmation dialog. Entity icons come from the entity-icon registry (`src/lib/icons/entity-icons.ts`) so an entity looks the same everywhere.
- Disabled with a tooltip explaining why is better than hidden when the user could gain the ability (upgrade/permission); hidden only when they never can.
- Keep the catch-all BFF route transport-only. Mobile and other clients must be able to use the API without recreating frontend business logic.
- Validate authorization again in Server Components, Server Actions, and the API. Proxy redirects are only an optimistic check.
- Update `/design` whenever a shared component or semantic token is added — a new `components/kit` component fails CI until it is catalogued. The catalogue also carries the contrast checks and the review checklist.
