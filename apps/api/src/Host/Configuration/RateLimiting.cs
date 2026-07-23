using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace BuildingBlocks.Host.Configuration;

/// <summary>Configurable rate-limit budget, bound from the <c>RateLimiting</c> section.</summary>
public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    public int PermitLimit { get; init; } = 100;
    public int WindowSeconds { get; init; } = 60;
}

/// <summary>
/// Baseline API rate limiting using the built-in ASP.NET limiter. Requests are
/// partitioned per authenticated user when a user is present, otherwise per client
/// IP — so one noisy tenant or address can't exhaust the budget for everyone.
/// Auth-specific aggressive limits are layered on by the authentication module
/// later; this is the global floor. Rejections return 429 with <c>Retry-After</c>.
/// </summary>
public static class RateLimiting
{
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RateLimitingOptions>(configuration.GetSection(RateLimitingOptions.SectionName));

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                // Read options at request time so test/host configuration overrides apply.
                var limits = context.RequestServices.GetRequiredService<IOptions<RateLimitingOptions>>().Value;

                var partitionKey = context.User.Identity?.IsAuthenticated == true
                    ? $"user:{context.User.Identity!.Name}"
                    : $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = limits.PermitLimit,
                    Window = TimeSpan.FromSeconds(limits.WindowSeconds),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0,
                });
            });

            options.OnRejected = (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                }

                return ValueTask.CompletedTask;
            };
        });

        return services;
    }
}
