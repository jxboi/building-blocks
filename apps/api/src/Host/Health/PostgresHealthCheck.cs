using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Persistence;

namespace BuildingBlocks.Host.Health;

/// <summary>
/// Readiness check for the one hard dependency. Postgres being down means the app
/// cannot serve — this check (tagged <c>ready</c>) fails the readiness probe so the
/// platform stops routing traffic, while liveness still passes (a restart won't
/// help). No pretend-degraded mode: Postgres is the hard tier (resilience policy).
/// </summary>
public sealed class PostgresHealthCheck(AppDbContext dbContext) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await dbContext.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("PostgreSQL reachable.")
                : HealthCheckResult.Unhealthy("PostgreSQL unreachable.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy("PostgreSQL check failed.", ex);
        }
    }
}
