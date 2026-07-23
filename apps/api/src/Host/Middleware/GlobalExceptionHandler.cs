using Kernel.Http;
using Kernel.Results;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BuildingBlocks.Host.Middleware;

/// <summary>
/// Last-resort handler for unhandled exceptions (bugs / infrastructure faults —
/// never expected failures, which flow as <see cref="Result"/>). Produces the same
/// RFC 9457 <c>application/problem+json</c> shape as a failed result, carrying the
/// correlation id so a support report ties back to the logged exception. The
/// exception detail itself is never leaked to the client.
/// </summary>
public sealed partial class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var correlationId = CorrelationId.From(httpContext);

        LogUnhandled(logger, exception, correlationId, httpContext.Request.Path.Value);

        var problem = new ProblemDetails
        {
            Type = ProblemTypes.TypeUriFor(ErrorType.Failure),
            Title = ProblemTypes.TitleFor(ErrorType.Failure),
            Status = StatusCodes.Status500InternalServerError,
            Detail = "An unexpected error occurred. Quote the correlation id when reporting this.",
        };
        if (!string.IsNullOrEmpty(correlationId))
        {
            problem.Extensions["correlationId"] = correlationId;
        }

        httpContext.Response.StatusCode = problem.Status.Value;
        await httpContext.Response.WriteAsJsonAsync(
            problem,
            options: null,
            contentType: "application/problem+json",
            cancellationToken);

        return true;
    }

    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Error,
        Message = "Unhandled exception. CorrelationId={CorrelationId} Path={Path}")]
    private static partial void LogUnhandled(ILogger logger, Exception exception, string? correlationId, string? path);
}
