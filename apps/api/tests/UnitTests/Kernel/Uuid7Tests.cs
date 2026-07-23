using Kernel.Domain;

namespace UnitTests.Kernel;

public sealed class Uuid7Tests
{
    [Fact]
    public void Generated_guid_has_version_7_and_rfc_variant()
    {
        var guid = Uuid7.NewGuid();
        var bytes = guid.ToByteArray();

        // Guid.ToByteArray reverses the first three groups; reverse them back to
        // read the canonical big-endian bytes we set.
        Array.Reverse(bytes, 0, 4);
        Array.Reverse(bytes, 4, 2);
        Array.Reverse(bytes, 6, 2);

        Assert.Equal(0x70, bytes[6] & 0xF0); // version 7
        Assert.Equal(0x80, bytes[8] & 0xC0); // variant 10xx
    }

    [Fact]
    public void Guids_are_ordered_by_timestamp()
    {
        var earlier = Uuid7.NewGuid(DateTimeOffset.UnixEpoch.AddSeconds(1));
        var later = Uuid7.NewGuid(DateTimeOffset.UnixEpoch.AddSeconds(2));

        // Canonical string form sorts lexicographically by the time prefix.
        Assert.True(string.CompareOrdinal(earlier.ToString(), later.ToString()) < 0);
    }

    [Fact]
    public void Guids_are_unique()
    {
        var guids = Enumerable.Range(0, 1000).Select(_ => Uuid7.NewGuid()).ToHashSet();

        Assert.Equal(1000, guids.Count);
    }
}
