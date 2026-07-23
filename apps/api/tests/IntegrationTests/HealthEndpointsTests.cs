using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace IntegrationTests;

public sealed class HealthEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Theory]
    [InlineData("/api/v1/health/live")]
    [InlineData("/api/v1/health/ready")]
    public async Task Health_endpoint_reports_healthy(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("healthy", body.GetProperty("status").GetString());
    }
}
