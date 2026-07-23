using Kernel.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Persistence.Interceptors;

/// <summary>
/// Stamps <c>created_at</c>/<c>updated_at</c> (UTC) on every <see cref="Entity"/>
/// as it is saved — created + updated on insert, updated on modify. Timestamps are
/// set through the change tracker (not CLR setters) so the values stay owned by the
/// persistence layer, never the caller. One interceptor, one convention, applied
/// everywhere the context saves.
/// </summary>
public sealed class AuditableEntityInterceptor(TimeProvider timeProvider) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        Stamp(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Stamp(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void Stamp(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;

        foreach (var entry in context.ChangeTracker.Entries<Entity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Property(nameof(Entity.CreatedAtUtc)).CurrentValue = nowUtc;
                    entry.Property(nameof(Entity.UpdatedAtUtc)).CurrentValue = nowUtc;
                    break;

                case EntityState.Modified:
                    entry.Property(nameof(Entity.UpdatedAtUtc)).CurrentValue = nowUtc;
                    break;
            }
        }
    }
}
