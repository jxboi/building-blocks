using BuildingBlocks.Host;
using Microsoft.AspNetCore.Mvc.Testing;

namespace IntegrationTests;

/// <summary>
/// Boots the real Host in-memory via <see cref="WebApplicationFactory{TEntryPoint}"/>.
/// No external dependencies yet — the shell has none (Postgres arrives with its own
/// module and its Testcontainers harness). Shared across a test class as a fixture.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
}
