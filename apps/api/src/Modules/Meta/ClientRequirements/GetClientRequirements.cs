using FluentValidation;
using Kernel.Messaging;
using Kernel.Results;
using Microsoft.Extensions.Options;

namespace Modules.Meta.ClientRequirements;

/// <summary>
/// Reads supported-client version requirements. With no <see cref="Client"/> the
/// whole map is returned; with one, just that client's requirement (or a typed
/// <c>NotFound</c>). This one slice exercises the pattern every module copies:
/// query → validator → handler → Result.
/// </summary>
public sealed record GetClientRequirementsQuery(string? Client) : IQuery<ClientRequirementsResponse>;

public sealed class GetClientRequirementsQueryValidator : AbstractValidator<GetClientRequirementsQuery>
{
    public GetClientRequirementsQueryValidator()
    {
        // The value is optional, but a provided client filter must not be blank.
        When(q => q.Client is not null, () =>
        {
            RuleFor(q => q.Client)
                .NotEmpty().WithMessage("Client must not be empty when provided.")
                .MaximumLength(50);
        });
    }
}

public sealed class GetClientRequirementsQueryHandler(IOptions<ClientRequirementsOptions> options)
    : IQueryHandler<GetClientRequirementsQuery, ClientRequirementsResponse>
{
    private readonly ClientRequirementsOptions _options = options.Value;

    public Task<Result<ClientRequirementsResponse>> HandleAsync(
        GetClientRequirementsQuery query,
        CancellationToken cancellationToken)
    {
        var configured = _options.Clients.Count > 0 ? _options.Clients : ClientRequirementsOptions.Defaults().Clients;

        var all = configured.ToDictionary(
            kvp => kvp.Key,
            kvp => new ClientRequirement(kvp.Value.MinVersion, kvp.Value.LatestVersion, kvp.Value.ForceUpgrade),
            StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(query.Client))
        {
            return Task.FromResult<Result<ClientRequirementsResponse>>(new ClientRequirementsResponse(all));
        }

        if (!all.TryGetValue(query.Client, out var requirement))
        {
            return Task.FromResult<Result<ClientRequirementsResponse>>(
                Error.NotFound("meta.client_unknown", $"No requirements are defined for client '{query.Client}'."));
        }

        var single = new Dictionary<string, ClientRequirement>(StringComparer.OrdinalIgnoreCase)
        {
            [query.Client] = requirement,
        };
        return Task.FromResult<Result<ClientRequirementsResponse>>(new ClientRequirementsResponse(single));
    }
}
