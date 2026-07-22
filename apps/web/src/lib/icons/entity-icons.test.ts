import { describe, expect, it } from "vitest";

import { entityIcon, entityIcons, type EntityKind } from "./entity-icons";

describe("entity icon registry", () => {
  it("resolves a defined icon for every entity kind", () => {
    for (const kind of Object.keys(entityIcons) as EntityKind[]) {
      expect(entityIcon(kind)).toBeDefined();
    }
  });

  it("uses a distinct icon per entity kind", () => {
    const icons = Object.values(entityIcons);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
