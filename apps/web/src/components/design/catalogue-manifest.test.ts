import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { KIT_IDS } from "./catalogue-manifest";
import { KIT_STATE_KINDS, kitCatalogue } from "./kit-catalogue";

const kitRoot = path.join(process.cwd(), "src", "components", "kit");

/** Every `.tsx` file under components/kit, as an id relative to the kit root. */
function discoverKitIds(dir = kitRoot, prefix = ""): string[] {
  const ids: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      ids.push(...discoverKitIds(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
      ids.push(rel.replace(/\.tsx$/, ""));
    }
  }
  return ids;
}

describe("design catalogue is exhaustive", () => {
  const discovered = discoverKitIds().sort();

  it("lists every kit component in the manifest", () => {
    // A new component under components/kit fails here until it is catalogued.
    const missing = discovered.filter((id) => !KIT_IDS.includes(id as (typeof KIT_IDS)[number]));
    expect(missing, "kit components missing from the /design catalogue").toEqual([]);
  });

  it("has no manifest entries without a source file", () => {
    const stale = [...KIT_IDS].filter((id) => !discovered.includes(id));
    expect(stale, "manifest ids with no matching component file").toEqual([]);
  });

  it("records every lifecycle state as shown or explicitly not applicable", () => {
    for (const id of KIT_IDS) {
      const entry = kitCatalogue[id];
      expect(Object.keys(entry.coverage).sort(), `${id} has incomplete state coverage`).toEqual(
        [...KIT_STATE_KINDS].sort(),
      );

      const shown = new Set(entry.states.map((state) => state.kind));
      for (const kind of KIT_STATE_KINDS) {
        const decision = entry.coverage[kind];
        if (decision === "shown") {
          expect(shown.has(kind), `${id} claims to show ${kind} but has no matching specimen`).toBe(true);
        } else {
          expect(decision.notApplicable.trim().length, `${id} needs a reason why ${kind} is not applicable`).toBeGreaterThan(0);
        }
      }
    }
  });
});
