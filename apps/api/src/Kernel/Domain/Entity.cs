namespace Kernel.Domain;

/// <summary>
/// Base type for every persisted aggregate root / entity. Establishes the
/// repo-wide conventions from the master plan: UUIDv7 primary keys and UTC
/// <c>created_at</c>/<c>updated_at</c> timestamps. Also the source of domain
/// events, which the dispatcher drains after a command commits.
/// </summary>
public abstract class Entity
{
    private readonly List<IDomainEvent> _domainEvents = new();

    protected Entity(Guid id)
    {
        Id = id;
    }

    /// <summary>Parameterless ctor for EF Core materialisation.</summary>
    protected Entity()
    {
    }

    public Guid Id { get; protected init; }

    public DateTime CreatedAtUtc { get; protected set; }

    public DateTime UpdatedAtUtc { get; protected set; }

    /// <summary>Events raised by this aggregate, drained by the dispatcher.</summary>
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void RaiseDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}
