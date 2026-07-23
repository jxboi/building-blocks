using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace IntegrationTests;

public sealed class RateLimitingTests
{
    [Fact]
    public async Task Exceeding_the_limit_returns_429_with_retry_after()
    {
        // A dedicated factory with a deliberately tiny window so the limit trips fast.
        using var factory = new ApiFactory().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RateLimiting:PermitLimit"] = "3",
                    ["RateLimiting:WindowSeconds"] = "60",
                })));

        var client = factory.CreateClient();

        HttpResponseMessage? limited = null;
        for (var i = 0; i < 6 && limited is null; i++)
        {
            var response = await client.GetAsync("/api/v1/meta/client-requirements");
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                limited = response;
            }
        }

        Assert.NotNull(limited);
        Assert.Equal(HttpStatusCode.TooManyRequests, limited!.StatusCode);
        Assert.True(limited.Headers.RetryAfter is not null, "429 response should carry a Retry-After header.");
    }
}
