import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("BFF architecture boundary", () => {
  it("keeps the catch-all handler as a transport adapter", async () => {
    const routePath = fileURLToPath(new URL("../../app/api/proxy/[...path]/route.ts", import.meta.url));
    const source = await readFile(routePath, "utf8");
    expect(source).not.toMatch(/@\/lib\/(?:domain|validation|features|permissions)/);
    expect(source).not.toContain("zod");
    expect(source).not.toContain("JSON.parse");
    expect(source).toContain("upstream.body");
  });
});
