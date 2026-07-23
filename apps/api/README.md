# API — .NET Core Shell

The backend host every building block plugs into. A modular monolith of vertical
slices over a shared `Kernel`, exposing a versioned REST API under `/api/v1`.

See [`dotnet-api/plan.md`](../../dotnet-api/plan.md) for the full design intent.

## Layout

```
apps/api/
├── Directory.Build.props     shared build settings (nullable, warnings-as-errors, analyzers)
├── src/
│   ├── Kernel/               Result/Error, Guard, Entity + UUIDv7, domain events,
│   │                         tenancy (ITenantContext, IOrganisationOwned),
│   │                         in-process messaging (ISender + pipeline behaviors),
│   │                         IModule contract, Result→ProblemDetails bridge
│   ├── Kernel.Contracts/     cross-module public DTOs + event contracts
│   ├── Persistence/          EF Core: AppDbContext, snake_case + timestamp + xmin
│   │                         conventions, tenant query filters, migrations
│   ├── Migrator/             console runner that applies migrations (deploy/CI)
│   ├── Host/                 composition root, middleware pipeline, module registrar
│   └── Modules/
│       └── Meta/             sample module — /api/v1/meta/client-requirements
├── tests/
│   ├── UnitTests/            Kernel + handler unit tests
│   └── IntegrationTests/     WebApplicationFactory + Testcontainers Postgres tests
└── scripts/export-openapi.sh export the OpenAPI document to apps/web
```

## Run & test

```bash
docker compose -f ../../infra/docker-compose.yml up -d postgres   # start the database
dotnet run --project src/Host/Host.csproj        # serves on the launchSettings port
dotnet test BuildingBlocks.sln                   # all unit + integration tests
```

Integration tests spin up their own Postgres via Testcontainers, so they need a
running Docker daemon (not the compose database). With Colima, export
`DOCKER_HOST=unix://$HOME/.colima/default/docker.sock` and
`TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock` first.

Key endpoints:

- `GET /api/v1/health/live` — liveness (process up; no dependency checks).
- `GET /api/v1/health/ready` — readiness (dependency checks tagged `ready`).
- `GET /api/v1/meta/client-requirements[?client=web]` — supported client versions.
- `GET /openapi/v1.json` — the OpenAPI document (Swagger UI at `/swagger` in Development).

## Conventions established here

- **Result pattern.** Expected failures are `Result`/`Result<T>` carrying an `Error`
  (typed: `Validation`/`NotFound`/`Conflict`/`Unauthorized`/`Forbidden`/`Failure`).
  Exceptions are for bugs/infrastructure only. `ApiResults.ToProblem` maps a failed
  result to an RFC 9457 `application/problem+json` response with a `correlationId`.
- **Messaging.** Endpoints send `ICommand`/`IQuery` messages through `ISender`; handlers
  implement `ICommandHandler`/`IQueryHandler`. Cross-cutting concerns are
  `IPipelineBehavior`s — `ValidationBehavior` (FluentValidation) ships here; the
  transaction behavior lands with the postgresql module.
- **Correlation id.** Every request gets an `X-Correlation-Id` (honouring an inbound
  one), echoed on the response and embedded in every problem document.
- **Security headers + rate limiting + CORS** apply to every response (see `Host/Configuration`).

## Database

- **PostgreSQL** via EF Core (Npgsql), one shared `AppDbContext`; modules contribute
  `IEntityTypeConfiguration` types (each mapping into its own schema) and register
  their assembly on `ModelAssemblies`.
- **Conventions (applied automatically):** snake_case singular tables/columns; `id`
  UUIDv7 PK; `created_at`/`updated_at` stamped by an interceptor; `xmin` optimistic
  concurrency; every `IOrganisationOwned` entity gets a **global tenant query filter**
  scoping reads to `ITenantContext.OrganisationId` (fail-closed when no tenant).
- **Tenancy gate:** `CrossTenantIsolationTests` is the permanent regression test — any
  new tenant-owned entity must keep it green. Never trust the client for the org.
- **Migrations:** forward-only, checked in under `src/Persistence/Migrations`. Apply
  with the runner (deploy/CI); dev auto-applies on startup when
  `Database:MigrateOnStartup=true` (set in launchSettings).

```bash
# add a migration after changing the model
dotnet ef migrations add <Name> --project src/Persistence --startup-project src/Persistence

# apply migrations (idempotent; exit 1 on failure — the CI gate)
dotnet run --project src/Migrator
```

`SampleRecord` (schema `sample`) is a **reference entity** proving the conventions and
the tenant gate — delete it once a real organisation-owned module lands.

## Configure

`appsettings.json` (env-overridable, `Section__Key` env var form):

- `Cors:AllowedOrigins` — browser origins allowed to call the API.
- `RateLimiting:PermitLimit` / `WindowSeconds` — the global per-user/per-IP budget
  (defaults 100 / 60s; returns 429 with `Retry-After`).
- `Meta:ClientRequirements:Clients` — min/latest version per client type.

## Extend — add a module

1. Create `src/Modules/<Name>/` referencing `Kernel` and `Kernel.Contracts`.
2. Implement `IModule` — register services (call `AddHandlersFrom(assembly)` for its
   slices) and map endpoints onto the injected `/api/v1` group.
3. Add one line to `Host/Modularity/ModuleRegistrar.Modules`. No other Host edits.

Each feature is a vertical slice: request/response + validator + handler in one folder.

## Regenerate the frontend client

After changing any endpoint contract:

```bash
./scripts/export-openapi.sh        # writes apps/web/openapi/v1.json
cd ../web && npm run api:generate  # regenerates the typed client
```

CI runs both and fails on checked-in drift.

## Remove a module

Delete its `src/Modules/<Name>/` project, remove its line from `ModuleRegistrar`, and
drop the project reference from `Host.csproj` and the solution. Nothing else references
a module directly — communication is via `Kernel.Contracts` and domain events.
