import { describe, expect, it } from "vitest";

import { queryKeys, staleTimes } from "@/lib/query/keys";

describe("query conventions", () => {
  it("keeps the three declared freshness tiers", () => {
    expect(staleTimes).toEqual({ reference: 300_000, content: 30_000, live: 0 });
  });

  it("includes tenant identity in workspace keys", () => {
    expect(queryKeys.workspace("acme")).toEqual(["workspace", "acme"]);
    expect(queryKeys.notifications("labs")).toEqual(["workspace", "labs", "notifications"]);
  });
});
