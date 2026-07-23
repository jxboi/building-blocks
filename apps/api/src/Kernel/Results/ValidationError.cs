namespace Kernel.Results;

/// <summary>
/// A validation failure carrying per-field messages. The ProblemDetails mapper
/// recognises this type and emits an RFC 9457 document with an <c>errors</c>
/// member (field → messages), the shape the frontend form kit expects.
/// </summary>
public sealed record ValidationError(IReadOnlyDictionary<string, string[]> Errors)
    : Error("validation.failed", "One or more validation errors occurred.", ErrorType.Validation);
