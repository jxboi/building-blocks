using Kernel.Results;
using Microsoft.AspNetCore.Http;

namespace Kernel.Http;

/// <summary>
/// Maps an <see cref="ErrorType"/> to its HTTP status code and RFC 9457
/// <c>type</c>/<c>title</c>. One table so every module produces identical
/// problem documents for the same class of failure.
/// </summary>
public static class ProblemTypes
{
    private const string BaseUri = "https://buildingblocks.dev/problems/";

    public static int StatusFor(ErrorType type) => type switch
    {
        ErrorType.Validation => StatusCodes.Status400BadRequest,
        ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
        ErrorType.Forbidden => StatusCodes.Status403Forbidden,
        ErrorType.NotFound => StatusCodes.Status404NotFound,
        ErrorType.Conflict => StatusCodes.Status409Conflict,
        _ => StatusCodes.Status500InternalServerError,
    };

    public static string TitleFor(ErrorType type) => type switch
    {
        ErrorType.Validation => "Validation failed",
        ErrorType.Unauthorized => "Unauthorized",
        ErrorType.Forbidden => "Forbidden",
        ErrorType.NotFound => "Not found",
        ErrorType.Conflict => "Conflict",
        _ => "An unexpected error occurred",
    };

    public static string TypeUriFor(ErrorType type) =>
        BaseUri + type.ToString().ToLowerInvariant();
}
