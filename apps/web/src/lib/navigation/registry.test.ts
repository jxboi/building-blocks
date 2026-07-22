import { describe, expect, it } from "vitest";

import messages from "../../../messages/en.json";
import { navigationRegistry, resolveHref } from "@/lib/navigation/registry";
import { adminSections, settingsSections, workspaceSections } from "@/lib/navigation/routes";

describe("navigation registry", () => {
  it("uses unique stable ids", () => {
    const ids = navigationRegistry.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every translation key", () => {
    for (const item of navigationRegistry) {
      const key = item.labelKey.replace("nav.", "") as keyof typeof messages.nav;
      expect(messages.nav[key], item.labelKey).toBeTruthy();
    }
  });

  it("covers every registered route section", () => {
    const hrefs = new Set(navigationRegistry.map((item) => resolveHref(item, "acme")));
    for (const section of workspaceSections) expect(hrefs.has(`/acme/${section}`)).toBe(true);
    for (const section of settingsSections) expect(hrefs.has(`/settings/${section}`)).toBe(true);
    for (const section of adminSections) expect(hrefs.has(`/admin/${section}`)).toBe(true);
  });
});
