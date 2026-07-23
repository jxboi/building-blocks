using Kernel.Domain;
using Kernel.Guards;

namespace Persistence.Sample;

/// <summary>
/// The reference tenant-owned entity for the persistence foundation. It exists only
/// to prove the conventions end-to-end — snake_case mapping, timestamps, xmin
/// concurrency, and above all the tenant query filter (the cross-tenant regression
/// gate runs against it). Delete it (and its migration/config) once a real
/// organisation-owned module lands; nothing in the shell depends on it.
/// </summary>
public sealed class SampleRecord : OrganisationOwnedEntity
{
    private SampleRecord()
    {
    }

    public SampleRecord(Guid organisationId, string name)
        : base(Uuid7.NewGuid(), organisationId)
    {
        Name = Guard.AgainstNullOrWhiteSpace(name);
    }

    public string Name { get; private set; } = string.Empty;

    public void Rename(string name) => Name = Guard.AgainstNullOrWhiteSpace(name);
}
