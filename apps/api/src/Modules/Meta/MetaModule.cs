using Kernel.DependencyInjection;
using Kernel.Http;
using Kernel.Messaging;
using Kernel.Modules;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Modules.Meta.ClientRequirements;

namespace Modules.Meta;

/// <summary>
/// Meta module: shell-level metadata endpoints. The reference implementation of
/// the module pattern — the smallest complete example an inheriting project copies.
/// </summary>
public sealed class MetaModule : IModule
{
    public string Name => "Meta";

    public void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ClientRequirementsOptions>(configuration.GetSection(ClientRequirementsOptions.SectionName));

        // Discover this module's handlers and validators.
        services.AddHandlersFrom(typeof(MetaModule).Assembly);
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/meta").WithTags("Meta");

        group.MapGet("/client-requirements", async (
                string? client,
                ISender sender,
                HttpContext http,
                CancellationToken cancellationToken) =>
            {
                var result = await sender.SendAsync(new GetClientRequirementsQuery(client), cancellationToken);
                return result.IsSuccess
                    ? Results.Ok(result.Value)
                    : result.ToProblem(http);
            })
            .WithName("getClientRequirements")
            .WithSummary("Minimum and current supported versions per client type.")
            .Produces<ClientRequirementsResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
