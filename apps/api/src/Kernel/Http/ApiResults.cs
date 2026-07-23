using Kernel.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Kernel.Http;

/// <summary>Where the correlation id is stashed on the request.</summary>
public static class CorrelationId
{
    public const string HeaderName = "X-Correlation-Id";
    public const string ItemKey = "CorrelationId";

    public static string? From(HttpContext context) =>
        context.Items.TryGetValue(ItemKey, out var value) ? value as string : null;
}

/// <summary>
/// Turns a failed <see cref="Result"/> into an RFC 9457 <c>application/problem+json</c>
/// response. Endpoints call <see cref="Problem(Error, HttpContext)"/> (or the
/// <c>ToProblem</c> extensions) so error mapping is identical everywhere and the
/// correlation id is always present for support/debugging.
/// </summary>
public static class ApiResults
{
    public static ProblemHttpResult Problem(Error error, HttpContext context)
    {
        var problem = new ProblemDetails
        {
            Type = ProblemTypes.TypeUriFor(error.Type),
            Title = ProblemTypes.TitleFor(error.Type),
            Status = ProblemTypes.StatusFor(error.Type),
            Detail = error.Message,
        };

        if (!string.IsNullOrEmpty(error.Code))
        {
            problem.Extensions["code"] = error.Code;
        }

        var correlationId = CorrelationId.From(context);
        if (!string.IsNullOrEmpty(correlationId))
        {
            problem.Extensions["correlationId"] = correlationId;
        }

        if (error is ValidationError validationError)
        {
            problem.Extensions["errors"] = validationError.Errors;
        }

        return TypedResults.Problem(problem);
    }

    /// <summary>Maps a failed non-generic result to a problem response.</summary>
    public static ProblemHttpResult ToProblem(this Result result, HttpContext context)
    {
        if (result.IsSuccess)
        {
            throw new InvalidOperationException("A successful result cannot be mapped to a problem.");
        }

        return Problem(result.Error, context);
    }

    /// <summary>Maps a failed result-of-T to a problem response.</summary>
    public static ProblemHttpResult ToProblem<TValue>(this Result<TValue> result, HttpContext context) =>
        Problem(result.Error, context);
}
