namespace Kernel.Messaging;

/// <summary>Continuation delegate for the next step in the pipeline.</summary>
public delegate Task<TResponse> MessageHandlerDelegate<TResponse>();

/// <summary>
/// A cross-cutting step wrapping message handling — validation, transactions,
/// logging. Behaviors run in registration order, outermost first, each choosing
/// whether to call <paramref name="next"/>. The transaction and validation
/// behaviors the plan calls for are implemented as pipeline behaviors.
/// </summary>
public interface IPipelineBehavior<in TMessage, TResponse>
    where TMessage : IMessage<TResponse>
{
    Task<TResponse> HandleAsync(
        TMessage message,
        MessageHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken);
}
