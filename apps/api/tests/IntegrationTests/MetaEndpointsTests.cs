using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kernel.Http;

namespace IntegrationTests;

public sealed class MetaEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Client_requirements_returns_configured_clients()
    {
        var response = await _client.GetAsync("/api/v1/meta/client-requirements");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("clients").TryGetProperty("web", out _));
    }

    [Fact]
    public async Task Unknown_client_returns_404_problem_json_with_correlation_id()
    {
        var response = await _client.GetAsync("/api/v1/meta/client-requirements?client=nope");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("meta.client_unknown", problem.GetProperty("code").GetString());
        Assert.False(string.IsNullOrEmpty(problem.GetProperty("correlationId").GetString()));

        // The correlation id in the body matches the response header.
        Assert.Equal(
            response.Headers.GetValues(CorrelationId.HeaderName).Single(),
            problem.GetProperty("correlationId").GetString());
    }

    [Fact]
    public async Task Blank_client_fails_validation_with_400_and_errors()
    {
        var response = await _client.GetAsync("/api/v1/meta/client-requirements?client=");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("validation.failed", problem.GetProperty("code").GetString());
        Assert.True(problem.TryGetProperty("errors", out var errors));
        Assert.True(errors.TryGetProperty("Client", out _));
    }

    [Fact]
    public async Task Inbound_correlation_id_is_honoured()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/meta/client-requirements");
        request.Headers.Add(CorrelationId.HeaderName, "test-correlation-123");

        var response = await _client.SendAsync(request);

        Assert.Equal("test-correlation-123", response.Headers.GetValues(CorrelationId.HeaderName).Single());
    }
}
