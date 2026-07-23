using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;

namespace Kernel.Messaging;

/// <summary>
/// Sends a message through its pipeline to its handler and returns the response.
/// The single entry point endpoints use to invoke commands and queries.
/// </summary>
public interface ISender
{
    Task<TResponse> SendAsync<TResponse>(IMessage<TResponse> message, CancellationToken cancellationToken = default);
}

/// <summary>
/// Reflection-light dispatcher. Resolves the handler and any pipeline behaviors
/// for a message from DI, composes the behaviors around the handler (outermost
/// first), and invokes the chain. Per-message-type wrappers are cached so the
/// reflection cost is paid once.
/// </summary>
internal sealed class Dispatcher(IServiceProvider provider) : ISender
{
    private static readonly ConcurrentDictionary<Type, object> WrapperCache = new();

    public Task<TResponse> SendAsync<TResponse>(IMessage<TResponse> message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);

        var wrapper = (HandlerWrapper<TResponse>)WrapperCache.GetOrAdd(
            message.GetType(),
            messageType =>
            {
                var wrapperType = typeof(HandlerWrapperImpl<,>).MakeGenericType(messageType, typeof(TResponse));
                return Activator.CreateInstance(wrapperType)!;
            });

        return wrapper.HandleAsync(message, provider, cancellationToken);
    }

    private abstract class HandlerWrapper<TResponse>
    {
        public abstract Task<TResponse> HandleAsync(
            IMessage<TResponse> message,
            IServiceProvider serviceProvider,
            CancellationToken cancellationToken);
    }

    private sealed class HandlerWrapperImpl<TMessage, TResponse> : HandlerWrapper<TResponse>
        where TMessage : IMessage<TResponse>
    {
        public override Task<TResponse> HandleAsync(
            IMessage<TResponse> message,
            IServiceProvider serviceProvider,
            CancellationToken cancellationToken)
        {
            var typed = (TMessage)message;
            var handler = serviceProvider.GetRequiredService<IHandler<TMessage, TResponse>>();

            MessageHandlerDelegate<TResponse> pipeline = () => handler.HandleAsync(typed, cancellationToken);

            // Compose behaviors so the first-registered runs outermost.
            var behaviors = serviceProvider.GetServices<IPipelineBehavior<TMessage, TResponse>>().ToArray();
            for (var i = behaviors.Length - 1; i >= 0; i--)
            {
                var behavior = behaviors[i];
                var next = pipeline;
                pipeline = () => behavior.HandleAsync(typed, next, cancellationToken);
            }

            return pipeline();
        }
    }
}
