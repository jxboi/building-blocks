using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Sample;

/// <summary>
/// Maps <see cref="SampleRecord"/> into the <c>sample</c> schema — the reference for
/// how a module configures a tenant-owned entity: singular table name, its own
/// schema, and the mandatory <c>organisation_id</c>-leading composite index the
/// tenancy rule requires on every tenant table.
/// </summary>
public sealed class SampleRecordConfiguration : IEntityTypeConfiguration<SampleRecord>
{
    public void Configure(EntityTypeBuilder<SampleRecord> builder)
    {
        builder.ToTable("sample_record", "sample");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.OrganisationId).IsRequired();

        builder.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        // Every tenant-owned table carries an organisation_id-leading composite index.
        builder.HasIndex(x => new { x.OrganisationId, x.Name });
    }
}
