using Kernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Persistence;

// Applies EF Core migrations to the target database. Run on deploy and in CI —
// never on prod app start (postgresql plan). Idempotent: re-running is a no-op once
// the database is at head. Exit code 0 on success, 1 on failure (CI gate).
var configuration = new ConfigurationBuilder()
    .AddEnvironmentVariables()
    .AddCommandLine(args)
    .Build();

var connectionString =
    configuration.GetConnectionString("Postgres")
    ?? configuration["ConnectionStrings:Postgres"]
    ?? "Host=localhost;Port=5432;Database=building_blocks;Username=bb;Password=bb_dev_password";

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention()
    .Options;

try
{
    await using var db = new AppDbContext(options, new AmbientTenantContext(), new ModelAssemblies());

    var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
    if (pending.Count == 0)
    {
        Console.WriteLine("Database is up to date. No migrations to apply.");
        return 0;
    }

    Console.WriteLine($"Applying {pending.Count} migration(s): {string.Join(", ", pending)}");
    await db.Database.MigrateAsync();
    Console.WriteLine("Migrations applied successfully.");
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Migration failed: {ex.Message}");
    return 1;
}
