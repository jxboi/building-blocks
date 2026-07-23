namespace Kernel.Domain;

/// <summary>
/// Marks an entity as tenant-owned: it carries an <see cref="OrganisationId"/> and
/// is automatically scoped by the persistence layer's global query filter. Every
/// tenant-owned table also gets a mandatory composite index leading with
/// <c>organisation_id</c> (postgresql plan). Reference data shared across tenants
/// does not implement this.
/// </summary>
public interface IOrganisationOwned
{
    Guid OrganisationId { get; }
}
