namespace Modules.Meta.ClientRequirements;

/// <summary>
/// Configured supported-client versions, bound from the <c>Meta:ClientRequirements</c>
/// configuration section. Until the settings registry (Kernel primitive) lands,
/// this is env/appsettings-driven; the query handler is the single reader, so the
/// source can change without touching call sites.
/// </summary>
public sealed class ClientRequirementsOptions
{
    public const string SectionName = "Meta:ClientRequirements";

    /// <summary>Client type → its version requirement.</summary>
    public Dictionary<string, ClientRequirementSetting> Clients { get; init; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Falls back to a single "web" entry when nothing is configured.</summary>
    public static ClientRequirementsOptions Defaults() => new()
    {
        Clients =
        {
            ["web"] = new ClientRequirementSetting
            {
                MinVersion = "0.1.0",
                LatestVersion = "0.1.0",
                ForceUpgrade = false,
            },
        },
    };
}

public sealed class ClientRequirementSetting
{
    public string MinVersion { get; init; } = "0.0.0";
    public string LatestVersion { get; init; } = "0.0.0";
    public bool ForceUpgrade { get; init; }
}
