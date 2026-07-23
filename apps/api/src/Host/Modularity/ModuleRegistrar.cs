using Kernel.Modules;
using Modules.Meta;

namespace BuildingBlocks.Host.Modularity;

/// <summary>
/// The single manifest of modules the Host composes. Adding a building block is a
/// one-line change here — the registrar wires its services and endpoints through
/// the <see cref="IModule"/> contract, so no other Host file changes. This is the
/// backend equivalent of the frontend nav registry: register, never edit the core.
/// </summary>
public static class ModuleRegistrar
{
    /// <summary>Every module in build order (dependencies before dependents).</summary>
    public static IReadOnlyList<IModule> Modules { get; } =
    [
        new MetaModule(),
    ];

    public static IServiceCollection AddModules(this IServiceCollection services, IConfiguration configuration)
    {
        foreach (var module in Modules)
        {
            module.AddServices(services, configuration);
        }

        return services;
    }

    public static IEndpointRouteBuilder MapModules(this IEndpointRouteBuilder endpoints)
    {
        foreach (var module in Modules)
        {
            module.MapEndpoints(endpoints);
        }

        return endpoints;
    }
}
