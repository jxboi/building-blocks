using BuildingBlocks.Host.Configuration;
using BuildingBlocks.Host.Middleware;
using BuildingBlocks.Host.Modularity;
using Kernel.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// --- Services (composition root) ---------------------------------------------

// RFC 9457 problem details for framework-generated responses (404/405/…);
// Result failures and unhandled exceptions produce the same shape explicitly.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Kernel in-process messaging (dispatcher + validation behavior), once.
builder.Services.AddKernel();

// Cross-cutting host concerns.
builder.Services.AddApiOpenApi();
builder.Services.AddApiCors(builder.Configuration);
builder.Services.AddApiRateLimiting(builder.Configuration);
builder.Services.AddHealthChecks();

// Persistence (conditional on a configured connection string) + readiness check.
builder.Services.AddApiPersistence(builder.Configuration);

// Modules — one line each in the registrar; each wires its own slices.
builder.Services.AddModules(builder.Configuration);

var app = builder.Build();

// Apply migrations on startup only when explicitly enabled (dev convenience).
await app.MigrateOnStartupIfEnabledAsync();

// --- Middleware pipeline (order matters — see dotnet-api plan) ----------------

// 1. Correlation id first, so every downstream component (including the exception
//    handler) can read and echo it.
app.UseMiddleware<CorrelationIdMiddleware>();

// 2. Exception → ProblemDetails.
app.UseExceptionHandler();

// 3. Security headers on every response.
app.UseMiddleware<SecurityHeadersMiddleware>();

// 4. CORS for the browser app.
app.UseCors(Cors.PolicyName);

// (Authentication → tenant resolution → authorization land with their modules.)

// 5. Rate limiting.
app.UseRateLimiter();

// OpenAPI document (+ Swagger UI in development).
app.UseApiOpenApi();

// 6. Endpoints.
app.MapHealthEndpoints();
app.MapGroup("/api/v1").MapModules();

app.Run();

// Exposed so the integration-test WebApplicationFactory can reference this assembly.
namespace BuildingBlocks.Host
{
    public partial class Program;
}
