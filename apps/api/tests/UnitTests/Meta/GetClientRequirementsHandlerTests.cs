using Kernel.Results;
using Microsoft.Extensions.Options;
using Modules.Meta.ClientRequirements;

namespace UnitTests.Meta;

public sealed class GetClientRequirementsHandlerTests
{
    private static GetClientRequirementsQueryHandler HandlerWith(params string[] clients)
    {
        var options = new ClientRequirementsOptions();
        foreach (var client in clients)
        {
            options.Clients[client] = new ClientRequirementSetting { MinVersion = "1.0.0", LatestVersion = "1.2.0" };
        }

        return new GetClientRequirementsQueryHandler(Options.Create(options));
    }

    [Fact]
    public async Task Returns_all_clients_when_none_requested()
    {
        var handler = HandlerWith("web", "ios");

        var result = await handler.HandleAsync(new GetClientRequirementsQuery(null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Clients.Count);
    }

    [Fact]
    public async Task Returns_only_the_requested_client()
    {
        var handler = HandlerWith("web", "ios");

        var result = await handler.HandleAsync(new GetClientRequirementsQuery("web"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var only = Assert.Single(result.Value.Clients);
        Assert.Equal("web", only.Key);
    }

    [Fact]
    public async Task Returns_not_found_for_unknown_client()
    {
        var handler = HandlerWith("web");

        var result = await handler.HandleAsync(new GetClientRequirementsQuery("android"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.NotFound, result.Error.Type);
        Assert.Equal("meta.client_unknown", result.Error.Code);
    }

    [Fact]
    public async Task Falls_back_to_defaults_when_unconfigured()
    {
        var handler = HandlerWith();

        var result = await handler.HandleAsync(new GetClientRequirementsQuery(null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Contains("web", result.Value.Clients.Keys);
    }
}
