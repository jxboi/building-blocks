namespace Kernel.Tenancy;

/// <summary>
/// The tenant scope for the current unit of work — the organisation whose data
/// the request may touch. Set by tenant-resolution middleware (organisations-
/// workspaces module) from the authenticated principal / route; read by the
/// persistence layer to drive global query filters. Every tenant-owned query is
/// silently scoped to <see cref="OrganisationId"/>; never trust the client for it.
/// </summary>
public interface ITenantContext
{
    /// <summary>The current organisation, or null when no tenant is resolved
    /// (system/background work, or an unauthenticated request). A null tenant
    /// fails closed: tenant-owned queries match nothing.</summary>
    Guid? OrganisationId { get; }

    /// <summary>True when a tenant is resolved.</summary>
    bool HasTenant => OrganisationId is not null;
}
