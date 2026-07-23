using BuildingBlocks.Host.Health;
using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.DependencyInjection;

namespace BuildingBlocks.Host.Configuration;

/// <summary>
/// Wires persistence into the Host. Registration is conditional on a configured
/// connection string so the API can boot (and its non-DB tests run) without a
/// database — the readiness probe simply reflects that Postgres isn't wired.
/// Migrations are applied on startup only when explicitly enabled
/// (<c>Database:MigrateOnStartup</c>) — never implicitly in production, where the
/// migration runner owns that step (postgresql plan).
/// </summary>
public static class PersistenceSetup
{
    public static IServiceCollection AddApiPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return services;
        }

        services.AddPersistence(connectionString);

        // Postgres is the hard dependency — its check gates readiness, not liveness.
        services.AddHealthChecks()
            .AddCheck<PostgresHealthCheck>("postgres", tags: [HealthEndpoints.ReadyTag]);

        return services;
    }

    public static async Task MigrateOnStartupIfEnabledAsync(this WebApplication app)
    {
        var connectionString = app.Configuration.GetConnectionString("Postgres");
        var enabled = app.Configuration.GetValue("Database:MigrateOnStartup", false);
        if (string.IsNullOrWhiteSpace(connectionString) || !enabled)
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }
}
