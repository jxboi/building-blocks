namespace Modules.Meta.ClientRequirements;

/// <summary>
/// The minimum and current supported version for one client type. Clients below
/// <see cref="MinVersion"/> must upgrade (<see cref="ForceUpgrade"/> gates native
/// apps that stores can't hot-patch); the web app compares its build to
/// <see cref="LatestVersion"/> to show the soft refresh banner.
/// </summary>
public sealed record ClientRequirement(string MinVersion, string LatestVersion, bool ForceUpgrade);

/// <summary>Supported-version requirements, keyed by client type (e.g. "web", "ios").</summary>
public sealed record ClientRequirementsResponse(IReadOnlyDictionary<string, ClientRequirement> Clients);
