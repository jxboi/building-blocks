namespace Kernel.Domain;

/// <summary>
/// A fact that has happened inside the domain. Raised by aggregates and
/// dispatched in-process after the owning command's transaction (audit /
/// cache-eviction subscribers run in-transaction; post-commit side effects go
/// through the outbox — see the background-jobs plan). Marker interface so the
/// dispatcher can constrain handlers.
/// </summary>
public interface IDomainEvent
{
    /// <summary>When the event occurred (UTC). Set at raise time.</summary>
    DateTime OccurredAtUtc { get; }
}
