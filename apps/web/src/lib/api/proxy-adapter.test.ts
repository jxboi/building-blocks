import { afterEach, describe, expect, it } from "vitest";

import { buildDownstreamHeaders, buildUpstreamHeaders, safeUpstreamUrl } from "@/lib/api/proxy-adapter";

describe("BFF transport adapter", () => {
  afterEach(() => delete process.env.API_BASE_URL);

  it("allow-lists browser headers and stamps the access token", () => {
    const headers = buildUpstreamHeaders(
      new Headers({ cookie: "secret", "content-type": "application/json", "x-idempotency-key": "one", "x-internal": "drop" }),
      "access-token",
    );
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-idempotency-key")).toBe("one");
    expect(headers.has("cookie")).toBe(false);
    expect(headers.has("x-internal")).toBe(false);
  });

  it("never relays upstream cookies or internal response headers", () => {
    const headers = buildDownstreamHeaders(new Headers({ "set-cookie": "token=secret", "content-type": "application/json", "x-internal": "drop" }));
    expect(headers.has("set-cookie")).toBe(false);
    expect(headers.has("x-internal")).toBe(false);
    expect(headers.get("cache-control")).toBe("no-store");
  });

  it("constructs API URLs without accepting path traversal", () => {
    process.env.API_BASE_URL = "https://api.example.com";
    expect(safeUpstreamUrl(["members"], "?page=2")?.toString()).toBe("https://api.example.com/api/v1/members?page=2");
    expect(safeUpstreamUrl(["..", "secrets"], "")).toBeUndefined();
    expect(safeUpstreamUrl([], "")).toBeUndefined();
  });
});
