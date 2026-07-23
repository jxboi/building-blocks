using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kernel.Modules;

/// <summary>
/// The contract every building block implements to plug into the Host. The Host
/// discovers modules and calls <see cref="AddServices"/> at composition time and
/// <see cref="MapEndpoints"/> when building the route table. Inheriting projects
/// add a module project and register it the same way — Host changes are one line.
/// This is the backend counterpart to the frontend's nav registry: register,
/// never edit the core.
/// </summary>
public interface IModule
{
    /// <summary>Stable module name, used for diagnostics and ordering.</summary>
    string Name { get; }

    /// <summary>Register the module's services into the container.</summary>
    void AddServices(IServiceCollection services, IConfiguration configuration);

    /// <summary>Map the module's endpoints. The group is already prefixed
    /// with the API version and carries shared conventions.</summary>
    void MapEndpoints(IEndpointRouteBuilder endpoints);
}
