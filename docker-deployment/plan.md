# Plan — Docker & Deployment Configuration

## Purpose
`git clone && docker compose up` gives a fully working stack; the same images deploy to production. CI/CD, environments, secrets, and the template-repo mechanics (rename script, upstream merges) live here.

## Decisions

### Local development
- **`docker compose` as the one dev entrypoint.** Services: `postgres`, `minio` (+ bootstrap bucket job), `mailpit`, `api` (hot-reload via `dotnet watch` in dev target), `web` (next dev), optional profiles: `observability` (Grafana LGTM), `worker` (dedicated job worker), `scanner` (ClamAV).
- Hybrid mode supported and documented: infra in compose, `api`/`web` run natively for best DX (fast rebuilds, debuggers) — compose files structured (`compose.yml` + `compose.dev.yml`) so both work.
- **`.env.example` is a contract:** exhaustive, commented, CI-checked against config classes so it never drifts.
- `make`/`just` task runner: `just up`, `just migrate`, `just seed`, `just test`, `just reset-db`.

### Images
- Multi-stage Dockerfiles: API → `mcr` SDK build → chiseled/distroless runtime, non-root, healthcheck; Web → Next.js standalone output, non-root. Both images stamp a **build id** (git sha) exposed as `X-Build-Id` response header + `/health/live` payload — feeds the version-skew refresh prompt (nextjs plan) and the admin System page. Both images take config exclusively from env vars; one image per service across all environments (build once, promote).
- Separate lightweight **migrator image** (runs EF migrations as a deploy step/job — never on app start in prod).

### CI/CD (GitHub Actions)
- **PR pipeline:** lint + typecheck (web), build + unit tests (both), integration tests (Testcontainers), migration-from-scratch check, `.env.example` drift check, Docker build.
- **Main pipeline:** everything above + push images (GHCR, tagged sha + semver) + deploy to staging + Playwright smoke against staging; production deploy on tag/manual approval.
- **Preview pipeline (label-gated):** on PR open/update, deploy ephemeral preview env (own DB, migrated + seeded), comment the URL on the PR; torn down on close.
- Dependabot/Renovate for deps; CodeQL + container scan (Trivy) + **secret scanning (gitleaks, blocking)** as quality gates.

### Environment model
Four rungs, each with a defined data policy — modules already key off these names (flag rules, price mappings, email safety rails, seeder guards):

| Env | Purpose | Data | Providers |
|---|---|---|---|
| `dev` | local compose | `standard` seed profile, reset at will | all local (Mailpit/MinIO/Null) |
| `preview` | **ephemeral env per PR** — isolated app + own database, auto-created on PR open, destroyed on merge/close | seeded `standard`; never prod data | local/test-mode |
| `staging` | shared QA/UAT — prod-parity config, where non-engineers validate before release | seeded `standard` (+ curated QA cases); refreshed on demand | real providers in **test mode** (Stripe test keys, sandbox email domain) |
| `production` | — | real | real |

- **Preview environments** are the "test this change in isolation" answer: reviewers and stakeholders click a URL per PR instead of queueing for staging. Implementation is intentionally cheap — the same compose stack on a VM or the platform's preview feature (references for both); each env gets its own database + MinIO bucket, migrations + seed run on boot. Optional CI stage (label-gated) so trivial PRs don't pay for it.
- **Data policy:** production data never flows to lower environments except through the masking runbook (`docs/runbooks/data-masking.md` — anonymise users, strip files/tokens/webhook secrets); default answer is "use the seed profiles — they exist precisely so QA never needs prod data."
- **Safety rails are structural, not procedural:** lower environments already hard-restrict email recipients (email plan), block real billing (test keys), and gate destructive seeder endpoints by environment check — a mis-set env var fails safe.

### Production target
- **Primary documented target: any container platform** — reference configs provided for (a) single VM with compose + Caddy (smallest projects), (b) Fly.io/Render-style PaaS, (c) Kubernetes manifests kept minimal under `infra/k8s/` (deferred until a project needs them). Managed Postgres + managed object storage assumed in prod (Neon/RDS + S3/R2).
- TLS at the edge (Caddy/platform), API + Web as separate services, worker as third service when enabled, `/health/*` as probes.
- **Secrets:** never in images or repo; env via platform secret store; rotation runbook in `docs/`.
- Zero-downtime: readiness-gated rollout + expand/contract migration discipline (postgresql plan) = no maintenance windows for routine deploys.
- **Scale-out notes (documented constraints):** rate limiting is in-memory per instance (limits approximate under N instances — acceptable; move to a distributed limiter only when a project needs exactness); SignalR beyond one instance requires the Redis backplane (notifications plan); server caches stay correct at N instances via TTL bounds (≤60s staleness) with the same Redis optionally enabling instant cross-instance eviction (caching policy, dotnet-api plan); Hangfire and the outbox are multi-instance-safe out of the box. Net: **one optional Redis** unlocks full multi-instance behaviour.

### Template-repo mechanics
- `scripts/rename.(sh|ps1)`: rebrands solution name, namespaces, package name, compose project, image names in one pass.
- `docs/upstream.md`: how to pull improvements from this template into inheriting repos (template remote + merge strategy; keep core files unedited).
- Module removal checklist references each optional module's own removal notes.

## Milestones
1. Compose dev stack (phase-1 foundation) + `.env.example` + just tasks.
2. Production Dockerfiles + migrator + healthchecks.
3. CI PR pipeline; then main pipeline + staging deploy.
4. Reference prod configs + runbooks + rename script.
