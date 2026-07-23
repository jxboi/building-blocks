using Kernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Persistence;

/// <summary>
/// Design-time factory so <c>dotnet ef</c> can build the context to add/inspect
/// migrations without running the Host. It uses an empty tenant context (migrations
/// describe schema, not tenant-scoped data) and reads the connection string from the
/// <c>ConnectionStrings__Postgres</c> environment variable, falling back to the local
/// dev database — a design-time value only, never used at runtime.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=building_blocks;Username=bb;Password=bb_dev_password";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new AppDbContext(options, new AmbientTenantContext(), new ModelAssemblies());
    }
}
