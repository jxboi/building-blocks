using Microsoft.OpenApi.Models;

namespace BuildingBlocks.Host.Configuration;

/// <summary>
/// OpenAPI document generation. The document at <c>/openapi/v1.json</c> is the
/// source of truth for the frontend typed client (nextjs plan): a build/CI step
/// exports it and regenerates <c>apps/web</c>'s client. Swagger UI is exposed in
/// development only.
/// </summary>
public static class OpenApiConfig
{
    public const string DocumentName = "v1";
    public const string DocumentRoute = "/openapi/v1.json";

    public static IServiceCollection AddApiOpenApi(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc(DocumentName, new OpenApiInfo
            {
                Title = "Building Blocks API",
                Version = "v1",
                Description = "The reusable application shell API.",
            });
            options.SupportNonNullableReferenceTypes();
        });

        return services;
    }

    public static WebApplication UseApiOpenApi(this WebApplication app)
    {
        // Serve the document at /openapi/{documentName}.json to match the web contract.
        app.UseSwagger(options => options.RouteTemplate = "openapi/{documentName}.json");

        if (app.Environment.IsDevelopment())
        {
            app.UseSwaggerUI(options => options.SwaggerEndpoint(DocumentRoute, "Building Blocks API v1"));
        }

        return app;
    }
}
