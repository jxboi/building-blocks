using System.Reflection;
using Kernel.Domain;
using Kernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

/// <summary>
/// The shared application <see cref="DbContext"/>. Modules contribute their entities
/// via <see cref="IEntityTypeConfiguration{TEntity}"/> in their own assembly (each
/// mapping into its own schema); the context discovers and applies them, then layers
/// the repo-wide conventions on top:
/// <list type="bullet">
/// <item>snake_case naming (applied via the naming-convention plugin in options),</item>
/// <item>a global tenant query filter on every <see cref="IOrganisationOwned"/> type,</item>
/// <item><c>xmin</c> optimistic concurrency on aggregates.</item>
/// </list>
/// The tenant filter reads <see cref="CurrentOrganisationId"/> — an instance member —
/// so EF re-evaluates it per query against the request's <see cref="ITenantContext"/>.
/// </summary>
public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ITenantContext tenantContext,
    ModelAssemblies modelAssemblies)
    : DbContext(options)
{
    private static readonly MethodInfo ApplyTenantFilterMethod = typeof(AppDbContext)
        .GetMethod(nameof(ApplyTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)!;

    /// <summary>Current tenant, read per query by the global filter. Fail-closed when null.</summary>
    public Guid? CurrentOrganisationId => tenantContext.OrganisationId;

    /// <summary>The reference tenant-owned entity (removable — see <see cref="Sample.SampleRecord"/>).</summary>
    public DbSet<Sample.SampleRecord> SampleRecords => Set<Sample.SampleRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Extensions that are safe to create on any Postgres go in the migration, so
        // Testcontainers and managed Postgres get them without the compose init script.
        // (pg_stat_statements needs shared_preload_libraries, so it stays compose-only.)
        modelBuilder.HasPostgresExtension("pg_trgm");
        modelBuilder.HasPostgresExtension("citext");
        modelBuilder.HasPostgresExtension("pgcrypto");

        foreach (var assembly in modelAssemblies.Assemblies)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(assembly);
        }

        ApplyConventions(modelBuilder);
    }

    private void ApplyConventions(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;

            if (typeof(Entity).IsAssignableFrom(clrType))
            {
                var entity = modelBuilder.Entity(clrType);

                // Domain events are in-memory only — never persisted.
                entity.Ignore(nameof(Entity.DomainEvents));

                // Standard base columns (plan: id, created_at, updated_at).
                entity.Property(nameof(Entity.Id)).HasColumnName("id");
                entity.Property(nameof(Entity.CreatedAtUtc)).HasColumnName("created_at");
                entity.Property(nameof(Entity.UpdatedAtUtc)).HasColumnName("updated_at");

                // Optimistic concurrency via Postgres' system xmin column, mapped as a
                // shadow concurrency token (the non-obsolete form of xmin concurrency).
                entity.Property<uint>("xmin")
                    .HasColumnName("xmin")
                    .HasColumnType("xid")
                    .ValueGeneratedOnAddOrUpdate()
                    .IsConcurrencyToken();
            }

            // Tenant isolation: filter every organisation-owned entity by the current org.
            if (typeof(IOrganisationOwned).IsAssignableFrom(clrType))
            {
                ApplyTenantFilterMethod.MakeGenericMethod(clrType).Invoke(this, [modelBuilder]);
            }
        }
    }

    private void ApplyTenantFilter<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, IOrganisationOwned
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => e.OrganisationId == CurrentOrganisationId);
    }
}
