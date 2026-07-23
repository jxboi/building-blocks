namespace Kernel.Domain;

/// <summary>
/// Base type for tenant-owned aggregates. Adds the <c>organisation_id</c> to the
/// standard <see cref="Entity"/> conventions; the persistence layer applies the
/// tenant query filter to every type deriving from this (or otherwise implementing
/// <see cref="IOrganisationOwned"/>).
/// </summary>
public abstract class OrganisationOwnedEntity : Entity, IOrganisationOwned
{
    protected OrganisationOwnedEntity(Guid id, Guid organisationId)
        : base(id)
    {
        OrganisationId = organisationId;
    }

    /// <summary>Parameterless ctor for EF Core materialisation.</summary>
    protected OrganisationOwnedEntity()
    {
    }

    public Guid OrganisationId { get; protected init; }
}
