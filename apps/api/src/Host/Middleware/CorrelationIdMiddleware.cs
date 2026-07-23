using Kernel.Http;

namespace BuildingBlocks.Host.Middleware;

/// <summary>
/// Assigns every request a correlation id — honouring an inbound
/// <c>X-Correlation-Id</c> header or minting one — stores it for handlers and the
/// ProblemDetails mapper to read, and echoes it on the response. The full
/// structured-logging enrichment is the logging-observability module's job; this
/// is the minimal seam it builds on so an error the user sees can be traced to a
/// log line.
/// </summary>
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(CorrelationId.HeaderName, out var inbound)
            && !string.IsNullOrWhiteSpace(inbound)
                ? inbound.ToString()
                : Guid.NewGuid().ToString("N");

        context.Items[CorrelationId.ItemKey] = correlationId;
        context.Response.Headers[CorrelationId.HeaderName] = correlationId;

        await next(context);
    }
}
