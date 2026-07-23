namespace BuildingBlocks.Host.Configuration;

/// <summary>
/// CORS for the browser-facing web app. Origins are configured (never wildcarded
/// with credentials); the BFF proxy is same-origin in production, so this policy
/// primarily serves local development where the web dev server and API run on
/// different ports.
/// </summary>
public static class Cors
{
    public const string PolicyName = "web-app";

    public static IServiceCollection AddApiCors(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                if (origins.Length > 0)
                {
                    policy.WithOrigins(origins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                        .WithExposedHeaders(Kernel.Http.CorrelationId.HeaderName);
                }
            });
        });

        return services;
    }
}
