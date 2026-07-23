using Kernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.Interceptors;
using Testcontainers.PostgreSql;

namespace IntegrationTests.Persistence;

/// <summary>
/// The shared Testcontainers Postgres harness every module's integration tests build
/// on. Spins up a real Postgres once per test collection, applies migrations from an
/// empty database (so the migration set is exercised on every run), and hands out
/// <see cref="AppDbContext"/> instances bound to a caller-controlled tenant. Disposed
/// with the collection, so the container is torn down after the suite.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("building_blocks_test")
        .WithUsername("bb")
        .WithPassword("bb_test_password")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        // Apply migrations from scratch — the same path the migration runner uses.
        await using var db = CreateDbContext(new AmbientTenantContext());
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    /// <summary>A context bound to the given tenant scope, wired exactly like the
    /// Host builds it (snake_case naming + timestamp interceptor). Pass an
    /// <see cref="AmbientTenantContext"/> the test controls to exercise the filter,
    /// and optionally a <see cref="TimeProvider"/> to control timestamps.</summary>
    public AppDbContext CreateDbContext(ITenantContext tenantContext, TimeProvider? timeProvider = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(new AuditableEntityInterceptor(timeProvider ?? TimeProvider.System))
            .Options;

        return new AppDbContext(options, tenantContext, new ModelAssemblies());
    }
}

/// <summary>Collection so the container is shared across the persistence test classes.</summary>
[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "postgres";
}
