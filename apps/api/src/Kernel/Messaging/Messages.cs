using Kernel.Results;

namespace Kernel.Messaging;

/// <summary>Marker for a message that flows through the dispatcher.</summary>
public interface IMessage;

/// <summary>A message that returns a <see cref="Result{TResponse}"/>.</summary>
/// <typeparam name="TResponse">The success payload type.</typeparam>
public interface IMessage<TResponse> : IMessage;

/// <summary>
/// A command mutates state. Wrapped in a transaction by the pipeline (one
/// transaction per command — see the dotnet-api plan).
/// </summary>
public interface ICommand : IMessage<Result>;

/// <summary>A command that returns a value on success.</summary>
public interface ICommand<TResponse> : IMessage<Result<TResponse>>;

/// <summary>A query reads state. Queries never open a write transaction.</summary>
public interface IQuery<TResponse> : IMessage<Result<TResponse>>;

/// <summary>Handles a message and produces its response.</summary>
public interface IHandler<in TMessage, TResponse>
    where TMessage : IMessage<TResponse>
{
    Task<TResponse> HandleAsync(TMessage message, CancellationToken cancellationToken);
}

/// <summary>Convenience alias for command handlers with no return value.</summary>
public interface ICommandHandler<in TCommand> : IHandler<TCommand, Result>
    where TCommand : ICommand;

/// <summary>Convenience alias for command handlers with a return value.</summary>
public interface ICommandHandler<in TCommand, TResponse> : IHandler<TCommand, Result<TResponse>>
    where TCommand : ICommand<TResponse>;

/// <summary>Convenience alias for query handlers.</summary>
public interface IQueryHandler<in TQuery, TResponse> : IHandler<TQuery, Result<TResponse>>
    where TQuery : IQuery<TResponse>;
