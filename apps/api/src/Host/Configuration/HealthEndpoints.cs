using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BuildingBlocks.Host.Configuration;

/// <summary>
/// Liveness and readiness probes. <c>/health/live</c> answers "is the process up"
/// (no dependency checks — a passing live probe with a failing ready probe means
/// "restart won't help, stop routing traffic"). <c>/health/ready</c> answers "can
/// it serve requests" and is where dependency checks (Postgres, once it lands)
/// register with the <c>ready</c> tag. Both return the JSON shape the web app's
/// generated client expects: <c>{ "status": "healthy" }</c>.
/// </summary>
public static class HealthEndpoints
{
    public const string ReadyTag = "ready";

    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // Liveness: process is running. No dependency checks run here.
        endpoints.MapHealthChecks("/api/v1/health/live", new HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter = WriteResponse,
        })
        .WithTags("Health")
        .AllowAnonymous();

        // Readiness: only checks tagged 'ready' participate.
        endpoints.MapHealthChecks("/api/v1/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains(ReadyTag),
            ResponseWriter = WriteResponse,
        })
        .WithTags("Health")
        .AllowAnonymous();

        return endpoints;
    }

    private static Task WriteResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        var status = report.Status == HealthStatus.Healthy ? "healthy" : "unhealthy";
        return context.Response.WriteAsync(JsonSerializer.Serialize(new { status }));
    }
}
