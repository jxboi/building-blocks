import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SPACING_STEPS } from "./scale";
import { TYPE_SCALE } from "./tokens";

/**
 * `no-off-scale-spacing` in eslint.config.mjs inlines its allow-set (the flat
 * config can't import this TS module). This test reads that set back out of the
 * config source and asserts it matches SPACING_STEPS, so the two can't drift.
 */
describe("spacing scale parity", () => {
  it("the lint rule's allow-set matches SPACING_STEPS", () => {
    const config = readFileSync(path.join(process.cwd(), "eslint.config.mjs"), "utf8");
    const match = /no-off-scale-spacing[\s\S]*?new Set\(\[([^\]]*)\]\)/.exec(config);
    expect(match, "no-off-scale-spacing allow-set not found in eslint.config.mjs").toBeTruthy();
    const ruleSteps = (match![1] ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    const sort = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);
    expect(sort(ruleSteps)).toEqual(sort(SPACING_STEPS));
  });

  it("the typography lint message names the complete type scale", () => {
    const config = readFileSync(path.join(process.cwd(), "eslint.config.mjs"), "utf8");
    for (const { className } of TYPE_SCALE) expect(config).toContain(className);
  });

  it("the motion lint rule rejects numeric duration and easing utilities", () => {
    const config = readFileSync(path.join(process.cwd(), "eslint.config.mjs"), "utf8");
    expect(config).toContain('"no-off-scale-motion"');
    expect(config).toContain("duration-\\d+");
    expect(config).toContain("ease-(?:linear|in|out|in-out)");
  });
});
