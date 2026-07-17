# Plan — Error Handling

## Purpose
One consistent error contract from database to pixel: predictable API error shapes, safe messages, correlation IDs for debugging, and frontend patterns that turn failures into good UX instead of blank screens.

## Decisions

### API
- **RFC 9457 ProblemDetails** for every non-2xx response — no exceptions. Shape: `type` (stable URI-style error code, e.g. `urn:bb:validation`), `title`, `status`, `detail` (safe, human-readable), `instance`, `correlationId`, and `errors` dictionary for field-level validation failures.
- **Expected failures use the Result pattern** (from dotnet-api plan): handlers return `Result<T>` with typed errors (`NotFound`, `Forbidden`, `Conflict`, `Validation`, `RateLimited`) mapped centrally to status codes. Throwing is reserved for bugs/infrastructure.
- **Global exception middleware** (outermost after logging): catches unhandled exceptions → logs full detail with correlation ID → returns generic 500 problem (`detail` never leaks exception messages, stack traces, or SQL in any environment; dev mode adds them under a `debug` extension only when `ASPNETCORE_ENVIRONMENT=Development`).
- **Error code catalogue** documented in one file; codes are part of the public contract (frontend switches on `type`, never on `detail` text).
- **Domain guardrails:** cancellation honored (`OperationCanceledException` → 499-style no-log), EF concurrency conflict → 409, Postgres unique violation mapped to typed `Conflict` (no raw constraint names to client). The two 409 flavours are distinct problem types: `urn:bb:conflict:concurrency` (record changed under you) vs `urn:bb:conflict:duplicate` (already exists/already done) — clients handle them differently.

### Frontend
- **Typed `ApiError`** parsed from ProblemDetails by the fetch wrapper; discriminated by `type`.
- **Route-level:** `error.tsx` boundaries per route group with retry; `not-found.tsx`; global fallback page with correlation ID displayed ("include this code when contacting support").
- **Mutation-level:** field errors bind to react-hook-form fields; non-field errors → toast; 401 → silent refresh (BFF single-flight); only if the session is truly gone: redirect to login **with return-URL preserved**, and the form kit's opt-in draft persistence (sessionStorage, long forms only) restores unsaved input after re-auth — expiring mid-edit never eats work; 403 → dedicated permission-denied component; 429 → retry-after aware toast; duplicate-POST 409 treated as already-done (retry-safety convention, dotnet-api plan).
- **Concurrent-edit UX (409 concurrency):** never silently overwrite, never just toast "failed" — the form kit's standard conflict flow: fetch the current version, show "this was changed by {actor} while you were editing" with the user's pending values preserved, offer *review & reapply* (default) or *discard mine*. Field-level diff/merge is a non-goal — the dialog is the shell's answer; products with heavy co-editing needs build beyond it.
- **Degradation-level:** feature-level error boundaries — a failing widget or soft dependency (search, stats, AI) degrades that surface with an inline fallback + banner, never the page; the per-dependency outage behaviours are declared in the resilience policy (dotnet-api plan).
- **Client crash reporting seam:** `reportError()` abstraction; Sentry (or similar) wired in logging-observability plan — this module defines the seam only.

### Cross-cutting
- **Correlation ID** generated at edge (BFF adds header) → flows through API logs → returned in every error response → shown on error pages. This is the support/debug thread that ties everything together.
- Error copy guidelines: actionable, no blame, no internals. Documented with examples.

## Milestones
1. ProblemDetails middleware + Result mapping + error catalogue.
2. Frontend fetch wrapper + ApiError + form/toast conventions.
3. Route boundaries + 401/403/429 flows.
4. Correlation ID end-to-end test (trigger error in UI, find log line by displayed ID).
