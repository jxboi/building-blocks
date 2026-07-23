using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace IntegrationTests;

public sealed class InfrastructureTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Security_headers_are_present_on_responses()
    {
        var response = await _client.GetAsync("/api/v1/health/live");

        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Equal("no-referrer", response.Headers.GetValues("Referrer-Policy").Single());
        Assert.Contains("frame-ancestors 'none'", response.Headers.GetValues("Content-Security-Policy").Single());
    }

    [Fact]
    public async Task Openapi_document_is_served_and_describes_the_api()
    {
        var response = await _client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var document = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("Building Blocks API", document.GetProperty("info").GetProperty("title").GetString());
        Assert.True(
            document.GetProperty("paths").TryGetProperty("/api/v1/meta/client-requirements", out _),
            "OpenAPI document should describe the meta endpoint.");
    }

    [Fact]
    public async Task Unknown_route_returns_problem_json_404()
    {
        var response = await _client.GetAsync("/api/v1/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
