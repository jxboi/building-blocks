import { describe, expect, it } from "vitest";

import { BANNER_ORDER, MAX_VISIBLE_BANNERS, resolveBanners, type BannerActive } from "./banners";

const make = (kind: BannerActive["kind"]): BannerActive => ({ kind, message: kind });

describe("resolveBanners", () => {
  it("orders banners by the fixed priority regardless of input order", () => {
    const { visible } = resolveBanners([make("degraded"), make("impersonation"), make("demo")]);
    expect(visible.map((b) => b.kind)).toEqual(["impersonation", "demo"]);
  });

  it("shows at most the max and collapses the remainder", () => {
    const { visible, hiddenCount } = resolveBanners([
      make("impersonation"),
      make("readOnly"),
      make("demo"),
      make("announcement"),
    ]);
    expect(visible).toHaveLength(MAX_VISIBLE_BANNERS);
    expect(visible.map((b) => b.kind)).toEqual(["impersonation", "readOnly"]);
    expect(hiddenCount).toBe(2);
  });

  it("dismisses a dismissible banner", () => {
    const { visible } = resolveBanners([make("announcement")], ["announcement"]);
    expect(visible).toHaveLength(0);
  });

  it("ignores dismissal of a non-dismissible banner", () => {
    const { visible } = resolveBanners([make("impersonation")], ["impersonation"]);
    expect(visible.map((b) => b.kind)).toEqual(["impersonation"]);
  });

  it("de-duplicates by kind, keeping the first occurrence", () => {
    const first: BannerActive = { kind: "announcement", message: "first" };
    const second: BannerActive = { kind: "announcement", message: "second" };
    const { visible } = resolveBanners([first, second]);
    expect(visible).toHaveLength(1);
    expect(visible[0]?.message).toBe("first");
  });

  it("keeps a higher-priority banner visible even when a dismissible one is dismissed", () => {
    const { visible, hiddenCount } = resolveBanners(
      [make("readOnly"), make("demo"), make("announcement")],
      ["announcement"],
    );
    expect(visible.map((b) => b.kind)).toEqual(["readOnly", "demo"]);
    expect(hiddenCount).toBe(0);
  });

  it("declares a priority for every kind", () => {
    expect(new Set(BANNER_ORDER).size).toBe(BANNER_ORDER.length);
  });
});
