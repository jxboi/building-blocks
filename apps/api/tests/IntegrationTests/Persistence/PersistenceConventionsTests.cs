using Kernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Persistence.Sample;

namespace IntegrationTests.Persistence;

/// <summary>
/// Proves the repo-wide persistence conventions on the reference entity: the
/// interceptor stamps timestamps, and xmin gives optimistic concurrency (a stale
/// update is rejected rather than silently clobbering).
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class PersistenceConventionsTests(PostgresFixture fixture)
{
    private readonly Guid _org = Guid.NewGuid();

    private AmbientTenantContext Tenant()
    {
        var t = new AmbientTenantContext();
        t.SetTenant(_org);
        return t;
    }

    [Fact]
    public async Task Interceptor_stamps_created_and_updated_timestamps()
    {
        Guid id;
        await using (var db = fixture.CreateDbContext(Tenant()))
        {
            var record = new SampleRecord(_org, "initial");
            db.SampleRecords.Add(record);
            await db.SaveChangesAsync();
            id = record.Id;

            Assert.NotEqual(default, record.CreatedAtUtc);
            Assert.Equal(record.CreatedAtUtc, record.UpdatedAtUtc);
        }

        await using (var db = fixture.CreateDbContext(Tenant()))
        {
            var record = await db.SampleRecords.SingleAsync(r => r.Id == id);
            var createdAt = record.CreatedAtUtc;
            record.Rename("renamed");
            await db.SaveChangesAsync();

            Assert.True(record.UpdatedAtUtc >= createdAt);
        }
    }

    [Fact]
    public async Task Xmin_rejects_a_stale_concurrent_update()
    {
        Guid id;
        await using (var seed = fixture.CreateDbContext(Tenant()))
        {
            var record = new SampleRecord(_org, "original");
            seed.SampleRecords.Add(record);
            await seed.SaveChangesAsync();
            id = record.Id;
        }

        // Two contexts load the same row; the first write wins, the second is stale.
        await using var first = fixture.CreateDbContext(Tenant());
        await using var second = fixture.CreateDbContext(Tenant());

        var firstCopy = await first.SampleRecords.SingleAsync(r => r.Id == id);
        var secondCopy = await second.SampleRecords.SingleAsync(r => r.Id == id);

        firstCopy.Rename("first-write");
        await first.SaveChangesAsync();

        secondCopy.Rename("second-write");
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());
    }
}
