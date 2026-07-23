using System.Reflection;
using Kernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Persistence.Interceptors;

namespace Persistence.DependencyInjection;

/// <summary>
/// Registers the persistence stack: the shared <see cref="AppDbContext"/> (Npgsql +
/// snake_case naming + timestamp interceptor), the scoped tenant context, and the
/// model-assembly registry modules extend. One call from the Host; modules add their
/// config assemblies via <see cref="ModelAssemblies"/>.
/// </summary>
public static class PersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        string connectionString,
        params Assembly[] moduleConfigurationAssemblies)
    {
        services.TryAddSingleton(TimeProvider.System);

        // Tenant context: one instance per scope, exposed as both the concrete
        // settable holder (middleware/tests) and the read-only interface (queries).
        services.TryAddScoped<AmbientTenantContext>();
        services.TryAddScoped<ITenantContext>(sp => sp.GetRequiredService<AmbientTenantContext>());

        var modelAssemblies = new ModelAssemblies();
        foreach (var assembly in moduleConfigurationAssemblies)
        {
            modelAssemblies.Add(assembly);
        }

        services.TryAddSingleton(modelAssemblies);
        services.TryAddSingleton<AuditableEntityInterceptor>();

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString);
            options.UseSnakeCaseNamingConvention();
            options.AddInterceptors(sp.GetRequiredService<AuditableEntityInterceptor>());
        });

        return services;
    }
}
