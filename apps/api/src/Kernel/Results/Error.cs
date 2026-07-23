namespace Kernel.Results;

/// <summary>
/// The category of an <see cref="Error"/>. Determines how the error maps to an
/// HTTP status code when translated to an RFC 9457 problem document.
/// </summary>
public enum ErrorType
{
    /// <summary>Unexpected failure / bug / infrastructure problem → 500.</summary>
    Failure = 0,

    /// <summary>Request failed validation → 400.</summary>
    Validation = 1,

    /// <summary>Requested resource does not exist → 404.</summary>
    NotFound = 2,

    /// <summary>State conflict / concurrency / duplicate → 409.</summary>
    Conflict = 3,

    /// <summary>Caller is not authenticated → 401.</summary>
    Unauthorized = 4,

    /// <summary>Caller is authenticated but not permitted → 403.</summary>
    Forbidden = 5,
}

/// <summary>
/// A machine-readable, expected failure. Errors carry a stable dotted
/// <see cref="Code"/> (used for the error catalogue and client handling) and a
/// human-readable <see cref="Message"/>. Errors are values, never exceptions —
/// exceptions are reserved for bugs and infrastructure faults.
/// </summary>
public record Error(string Code, string Message, ErrorType Type)
{
    /// <summary>The absence of an error. A successful result carries this.</summary>
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure);

    public static Error Validation(string code, string message) => new(code, message, ErrorType.Validation);

    public static Error NotFound(string code, string message) => new(code, message, ErrorType.NotFound);

    public static Error Conflict(string code, string message) => new(code, message, ErrorType.Conflict);

    public static Error Unauthorized(string code, string message) => new(code, message, ErrorType.Unauthorized);

    public static Error Forbidden(string code, string message) => new(code, message, ErrorType.Forbidden);

    public static Error Failure(string code, string message) => new(code, message, ErrorType.Failure);
}
