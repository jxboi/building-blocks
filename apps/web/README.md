# Building Blocks web shell

The shared Next.js App Router frontend described in [`nextjs/plan.md`](../../nextjs/plan.md). It is a tenant-aware product shell, not a marketing site.

## Run it

Use Node 22 (`.nvmrc`), copy `.env.example` to `.env.local`, then:

```bash
npm install
npm run dev
```

Open `/demo` for the public shell preview, `/design` for the development-only living catalogue, or `/login` for the authentication entry flow. Authenticated workspace routes require the `bb_refresh` httpOnly cookie.

## Architecture

- `src/app/(auth)` contains entry and recovery flows.
- `src/app/(app)` contains the workspace and settings shells.
- `src/app/(admin)` contains the separate operator shell.
- `src/components/ui` is generated shadcn source. Product code should compose `kit`, `layout`, and domain components rather than edit primitives ad hoc.
- `src/lib/navigation/registry.ts` is the module registration seam for sidebar, command palette, permissions, feature gates, shortcuts, and help URLs.
- `src/app/api/proxy/[...path]` is a transport-only BFF. It may translate the refresh cookie to an access-token header, stamp correlation headers, and stream the response. Business validation and data shaping belong in the API.
- `openapi/shell.openapi.json` is the temporary standalone contract. Replace it with the .NET-generated OpenAPI document when the API module lands, then run `npm run api:generate`.

All authenticated product routes are dynamically rendered. The nonce-based CSP is generated per request in `src/proxy.ts`; proxy is an optimistic redirect layer, never the final authorization check.

## Extend it

Register a new product page in `src/lib/navigation/registry.ts`, add its permission and feature key, then create the route below `(app)/[workspace]`. Reuse the kits for filters, tables, messaging, confirmation, images, and dashboards. Add a help URL in the same registry entry.

Dashboard widgets are registered in `src/lib/dashboard/widget-registry.ts`. Users configure registered widgets; they never author queries or formulas.

## Rebrand it

Edit only the primitive palette at the top of `src/app/globals.css`, the brand copy in `messages/en.json`, and `BrandMark`. Semantic roles and product components should not move.

## Remove it

Delete `apps/web` and remove its CI job. The BFF owns no business rules or persistent data, so removing the frontend does not alter the API contract.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Lint rejects raw interactive HTML and images outside the primitive layer, off-scale arbitrary values, and mixed icon libraries. Vitest covers registries, security policy, query keys, widget schemas, and the BFF boundary. Playwright covers the CSP/header baseline, axe, and the 375px mobile shell.
