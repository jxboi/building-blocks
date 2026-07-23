using Kernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Persistence.Sample;

namespace IntegrationTests.Persistence;

/// <summary>
/// The cross-tenant regression gate — the single most important test in the repo
/// (build order). It proves the global query filter scopes every tenant-owned read
/// to the current organisation. Any new organisation-owned entity must stay green
/// here. If this ever fails, tenant data is leaking across organisations.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class CrossTenantIsolationTests(PostgresFixture fixture)
{
    private readonly Guid _orgA = Guid.NewGuid();
    private readonly Guid _orgB = Guid.NewGuid();

    [Fact]
    public async Task Queries_only_return_rows_for_the_current_tenant()
    {
        await SeedOneRecordPerOrg();

        var tenant = new AmbientTenantContext();

        tenant.SetTenant(_orgA);
        await using (var db = fixture.CreateDbContext(tenant))
        {
            var records = await db.SampleRecords.ToListAsync();
            Assert.All(records, r => Assert.Equal(_orgA, r.OrganisationId));
            Assert.Single(records);
        }

        tenant.SetTenant(_orgB);
        await using (var db = fixture.CreateDbContext(tenant))
        {
            var records = await db.SampleRecords.ToListAsync();
            Assert.All(records, r => Assert.Equal(_orgB, r.OrganisationId));
            Assert.Single(records);
        }
    }

    [Fact]
    public async Task No_tenant_scope_returns_nothing_fail_closed()
    {
        await SeedOneRecordForOrg(_orgA);

        // A context with no resolved tenant must see no tenant-owned rows.
        await using var db = fixture.CreateDbContext(new AmbientTenantContext());

        Assert.Empty(await db.SampleRecords.ToListAsync());
    }

    [Fact]
    public async Task Ignore_query_filters_sees_all_tenants_for_system_work()
    {
        await SeedOneRecordForOrg(_orgA);

        await using var db = fixture.CreateDbContext(new AmbientTenantContext());

        // System/background work can opt out explicitly — the escape hatch is loud.
        var all = await db.SampleRecords.IgnoreQueryFilters().ToListAsync();
        Assert.NotEmpty(all);
    }

    private async Task SeedOneRecordForOrg(Guid organisationId)
    {
        // Seeding writes rows for a specific org; the writing context is scoped to it.
        var tenant = new AmbientTenantContext();
        tenant.SetTenant(organisationId);
        await using var db = fixture.CreateDbContext(tenant);
        db.SampleRecords.Add(new SampleRecord(organisationId, $"record-{organisationId:N}"));
        await db.SaveChangesAsync();
    }

    private async Task SeedOneRecordPerOrg()
    {
        await SeedOneRecordForOrg(_orgA);
        await SeedOneRecordForOrg(_orgB);
    }
}
