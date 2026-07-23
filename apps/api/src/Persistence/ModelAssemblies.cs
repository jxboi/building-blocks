using System.Reflection;

namespace Persistence;

/// <summary>
/// The set of assemblies whose <c>IEntityTypeConfiguration</c> types the shared
/// context applies. The persistence assembly registers itself; each module adds its
/// own assembly at registration, so entities map into their module's schema without
/// the context knowing every module by name.
/// </summary>
public sealed class ModelAssemblies
{
    private readonly List<Assembly> _assemblies = [typeof(ModelAssemblies).Assembly];

    public IReadOnlyList<Assembly> Assemblies => _assemblies;

    public ModelAssemblies Add(Assembly assembly)
    {
        if (!_assemblies.Contains(assembly))
        {
            _assemblies.Add(assembly);
        }

        return this;
    }
}
