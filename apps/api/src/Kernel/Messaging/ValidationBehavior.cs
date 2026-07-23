using FluentValidation;
using Kernel.Results;

namespace Kernel.Messaging;

/// <summary>
/// Runs every registered <see cref="IValidator{T}"/> for a message before it
/// reaches its handler. On failure it short-circuits with a <see cref="ValidationError"/>
/// result — no exception, no handler call — which the ProblemDetails mapper turns
/// into a 400 problem+json. This is why handlers never re-validate their input.
/// </summary>
public sealed class ValidationBehavior<TMessage, TResponse>(IEnumerable<IValidator<TMessage>> validators)
    : IPipelineBehavior<TMessage, TResponse>
    where TMessage : IMessage<TResponse>
{
    public async Task<TResponse> HandleAsync(
        TMessage message,
        MessageHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var validatorList = validators as IReadOnlyList<IValidator<TMessage>> ?? validators.ToArray();
        if (validatorList.Count == 0)
        {
            return await next().ConfigureAwait(false);
        }

        var context = new ValidationContext<TMessage>(message);
        var failures = new List<FluentValidation.Results.ValidationFailure>();
        foreach (var validator in validatorList)
        {
            var result = await validator.ValidateAsync(context, cancellationToken).ConfigureAwait(false);
            if (!result.IsValid)
            {
                failures.AddRange(result.Errors);
            }
        }

        if (failures.Count == 0)
        {
            return await next().ConfigureAwait(false);
        }

        var errors = failures
            .GroupBy(f => f.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(f => f.ErrorMessage).Distinct().ToArray());

        return ResultFactory.Failure<TResponse>(new ValidationError(errors));
    }
}
