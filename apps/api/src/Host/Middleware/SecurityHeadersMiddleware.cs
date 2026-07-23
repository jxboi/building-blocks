namespace BuildingBlocks.Host.Middleware;

/// <summary>
/// Sets the baseline security headers on every API response (master plan: strict
/// headers on web and API, verified in CI). The API serves JSON only — no HTML,
/// scripts, or embedding — so the policy is deliberately locked down: deny framing,
/// no sniffing, no referrer, and a CSP that forbids any resource loading.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "no-referrer";
        headers["Cross-Origin-Resource-Policy"] = "same-origin";
        headers["Cross-Origin-Opener-Policy"] = "same-origin";
        // JSON API: nothing should ever be loaded or framed from these responses.
        headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
        // Strip the framework's fingerprinting header.
        headers.Remove("X-Powered-By");

        return next(context);
    }
}
