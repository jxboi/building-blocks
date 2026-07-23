using System.Reflection;
using FluentValidation;
using Kernel.Messaging;
using Microsoft.Extensions.DependencyInjection;

namespace Kernel.DependencyInjection;

/// <summary>
/// Kernel messaging registration, split so the singletons register exactly once
/// and each module contributes only its own slices:
/// <list type="bullet">
/// <item><see cref="AddKernel"/> — the dispatcher and pipeline behaviors; Host calls it once.</item>
/// <item><see cref="AddHandlersFrom"/> — handlers and validators in an assembly; each module calls it.</item>
/// </list>
/// </summary>
public static class KernelServiceCollectionExtensions
{
    /// <summary>Registers the core messaging services. Call once from the Host.</summary>
    public static IServiceCollection AddKernel(this IServiceCollection services)
    {
        services.AddScoped<ISender, Dispatcher>();

        // Validation runs as the outermost behavior. Registered once so it does
        // not multiply as modules are added.
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }

    /// <summary>Scans the given assemblies for message handlers and validators.</summary>
    public static IServiceCollection AddHandlersFrom(this IServiceCollection services, params Assembly[] assemblies)
    {
        foreach (var assembly in assemblies.Distinct())
        {
            RegisterImplementationsOf(services, assembly, typeof(IHandler<,>));
            RegisterImplementationsOf(services, assembly, typeof(IValidator<>));
        }

        return services;
    }

    private static void RegisterImplementationsOf(IServiceCollection services, Assembly assembly, Type openInterface)
    {
        var implementations = assembly.GetTypes()
            .Where(t => t is { IsAbstract: false, IsInterface: false, IsGenericTypeDefinition: false });

        foreach (var implementation in implementations)
        {
            var closedInterfaces = implementation.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == openInterface);

            foreach (var closedInterface in closedInterfaces)
            {
                services.AddScoped(closedInterface, implementation);
            }
        }
    }
}
