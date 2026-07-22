import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy, securityHeaders } from "@/lib/security/headers";

describe("security headers", () => {
  it("builds a nonce-based production script policy without unsafe-inline", () => {
    const policy = createContentSecurityPolicy("test-nonce", false);
    const scriptDirective = policy.split("; ").find((value) => value.startsWith("script-src"));
    expect(scriptDirective).toContain("'nonce-test-nonce'");
    expect(scriptDirective).toContain("'strict-dynamic'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(scriptDirective).not.toContain("'unsafe-eval'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("defines the baseline browser protections", () => {
    expect(securityHeaders["Strict-Transport-Security"]).toContain("includeSubDomains");
    expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff");
    expect(securityHeaders["Permissions-Policy"]).toContain("camera=()");
  });
});
