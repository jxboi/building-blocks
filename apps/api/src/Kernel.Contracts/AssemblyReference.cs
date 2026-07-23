namespace Kernel.Contracts;

/// <summary>
/// Marker for the cross-module contracts assembly: the only place modules share
/// public DTOs and domain-event contracts. A module may reference this assembly
/// but never another module's internals — cross-module communication travels
/// through these contracts or through domain events.
/// </summary>
public static class AssemblyReference
{
    public static readonly System.Reflection.Assembly Assembly = typeof(AssemblyReference).Assembly;
}
