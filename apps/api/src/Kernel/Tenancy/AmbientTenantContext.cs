namespace Kernel.Tenancy;

/// <summary>
/// A mutable, scoped <see cref="ITenantContext"/> whose value is stamped once per
/// request by tenant-resolution middleware (and set directly in tests). The real
/// resolution logic — deriving the org from claims/route and validating membership
/// — lands with the organisations-workspaces module; this holder is the seam it
/// writes into.
/// </summary>
public sealed class AmbientTenantContext : ITenantContext
{
    public Guid? OrganisationId { get; private set; }

    /// <summary>Binds the current scope to an organisation. Idempotent per scope.</summary>
    public void SetTenant(Guid organisationId) => OrganisationId = organisationId;

    /// <summary>Clears the tenant (system/background scope).</summary>
    public void Clear() => OrganisationId = null;
}
