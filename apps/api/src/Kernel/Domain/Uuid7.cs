using System.Security.Cryptography;

namespace Kernel.Domain;

/// <summary>
/// Generates UUIDv7 identifiers — time-ordered GUIDs (RFC 9562). Used for every
/// primary key in the shell (master plan convention): the leading 48-bit
/// millisecond timestamp gives database-friendly, roughly monotonic keys while
/// staying globally unique. Replaceable by <c>Guid.CreateVersion7()</c> once the
/// shell moves to .NET 9+.
/// </summary>
public static class Uuid7
{
    public static Guid NewGuid() => NewGuid(DateTimeOffset.UtcNow);

    public static Guid NewGuid(DateTimeOffset timestamp)
    {
        Span<byte> bytes = stackalloc byte[16];
        RandomNumberGenerator.Fill(bytes[6..]);

        long unixMs = timestamp.ToUnixTimeMilliseconds();

        // 48-bit big-endian millisecond timestamp in the first six bytes.
        bytes[0] = (byte)(unixMs >> 40);
        bytes[1] = (byte)(unixMs >> 32);
        bytes[2] = (byte)(unixMs >> 24);
        bytes[3] = (byte)(unixMs >> 16);
        bytes[4] = (byte)(unixMs >> 8);
        bytes[5] = (byte)unixMs;

        // Version 7 in the high nibble of byte 6.
        bytes[6] = (byte)((bytes[6] & 0x0F) | 0x70);

        // RFC 4122 variant (10xx) in the two high bits of byte 8.
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80);

        return FromBigEndian(bytes);
    }

    // Guid(byte[]) interprets the first three groups little-endian; build the GUID
    // so its canonical string form preserves the big-endian byte order above,
    // keeping the identifiers lexicographically sortable in that form.
    private static Guid FromBigEndian(ReadOnlySpan<byte> bytes)
    {
        Span<byte> reordered = stackalloc byte[16];
        bytes.CopyTo(reordered);

        (reordered[0], reordered[3]) = (reordered[3], reordered[0]);
        (reordered[1], reordered[2]) = (reordered[2], reordered[1]);
        (reordered[4], reordered[5]) = (reordered[5], reordered[4]);
        (reordered[6], reordered[7]) = (reordered[7], reordered[6]);

        return new Guid(reordered);
    }
}
