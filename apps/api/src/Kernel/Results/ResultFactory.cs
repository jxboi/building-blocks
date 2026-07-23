using System.Collections.Concurrent;
using System.Reflection;

namespace Kernel.Results;

/// <summary>
/// Builds a failed result of an arbitrary result type from an <see cref="Error"/>.
/// Pipeline behaviors (validation) short-circuit by producing a failure of the
/// message's declared response type without knowing whether it is <see cref="Result"/>
/// or <see cref="Result{TValue}"/> at compile time.
/// </summary>
public static class ResultFactory
{
    private static readonly ConcurrentDictionary<Type, MethodInfo> GenericFailureCache = new();

    public static TResponse Failure<TResponse>(Error error)
    {
        if (typeof(TResponse) == typeof(Result))
        {
            return (TResponse)(object)Result.Failure(error);
        }

        // TResponse is Result<TValue> — invoke the generic Result.Failure<TValue>.
        var valueType = typeof(TResponse).GetGenericArguments()[0];
        var method = GenericFailureCache.GetOrAdd(valueType, static vt =>
            typeof(Result)
                .GetMethods(BindingFlags.Public | BindingFlags.Static)
                .Single(m => m is { Name: nameof(Result.Failure), IsGenericMethod: true })
                .MakeGenericMethod(vt));

        return (TResponse)method.Invoke(null, [error])!;
    }
}
