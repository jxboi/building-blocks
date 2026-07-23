using System.Runtime.CompilerServices;

namespace Kernel.Guards;

/// <summary>
/// Guard clauses for enforcing invariants at construction/entry points. These
/// throw for programming errors (a caller passing something that should never
/// happen) — they are not the mechanism for expected failures, which use
/// <see cref="Results.Result"/> instead.
/// </summary>
public static class Guard
{
    public static T AgainstNull<T>(T? value, [CallerArgumentExpression(nameof(value))] string? paramName = null)
        where T : class
        => value ?? throw new ArgumentNullException(paramName);

    public static string AgainstNullOrWhiteSpace(string? value, [CallerArgumentExpression(nameof(value))] string? paramName = null)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value cannot be null or whitespace.", paramName);
        }

        return value;
    }

    public static Guid AgainstEmpty(Guid value, [CallerArgumentExpression(nameof(value))] string? paramName = null)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("Value cannot be an empty GUID.", paramName);
        }

        return value;
    }
}
