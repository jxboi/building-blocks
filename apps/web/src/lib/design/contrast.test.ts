import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONTRAST_PAIRS,
  contrastRatio,
  evaluatePairs,
  oklchToLinearSrgb,
  parseOklch,
  parseThemes,
  readSelectorTokens,
  relativeLuminance,
  resolveToken,
} from "./contrast";

const css = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
const { light, dark } = parseThemes(css);

describe("oklch conversion", () => {
  it("maps pure white and black to expected luminance extremes", () => {
    const white = oklchToLinearSrgb(parseOklch("oklch(1 0 0)")!);
    const black = oklchToLinearSrgb(parseOklch("oklch(0 0 0)")!);
    expect(relativeLuminance(white)).toBeCloseTo(1, 2);
    expect(relativeLuminance(black)).toBeCloseTo(0, 2);
  });

  it("computes the canonical 21:1 ratio for black on white", () => {
    const ratio = contrastRatio(parseOklch("oklch(0 0 0)")!, parseOklch("oklch(1 0 0)")!);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("parses the alpha channel", () => {
    expect(parseOklch("oklch(1 0 0 / 0.5)")?.alpha).toBe(0.5);
    expect(parseOklch("oklch(1 0 0)")?.alpha).toBe(1);
  });
});

describe("theme parsing", () => {
  it("resolves both themes without dropping tokens near comments", () => {
    // Regression: a colon inside a CSS comment used to drop --background.
    expect(light.get("--background")).toBeTruthy();
    expect(dark.get("--background")).toBeTruthy();
  });

  it("inherits unoverridden primitives into the dark theme", () => {
    expect(dark.get("--primitive-ink-25")).toBe(light.get("--primitive-ink-25"));
  });
});

describe("catalogue specimen themes mirror the app themes", () => {
  // `.catalogue-light` / `.catalogue-dark` scope the side-by-side theme
  // specimens on /design. `.catalogue-light` is a *separate* rule from `:root`
  // (it must out-specify `.dark` for a light subtree nested in a dark page), so
  // it is a hand-maintained copy that can silently drift. Assert it cannot.
  const catalogueLight = readSelectorTokens(css, ".catalogue-light");
  const catalogueDark = readSelectorTokens(css, ".catalogue-dark");

  it("declares tokens for both specimens", () => {
    expect(catalogueLight.size).toBeGreaterThan(0);
    expect(catalogueDark.size).toBeGreaterThan(0);
  });

  it("resolves .catalogue-light identically to :root", () => {
    const merged = new Map(light);
    for (const [k, v] of catalogueLight) merged.set(k, v);
    for (const key of catalogueLight.keys()) {
      const rootVal = light.get(key);
      expect(rootVal, `:root is missing ${key}`).toBeDefined();
      expect(resolveToken(merged.get(key)!, merged), `catalogue-light ${key} drifted from :root`).toEqual(
        resolveToken(rootVal!, light),
      );
    }
  });

  it("resolves .catalogue-dark identically to the dark theme", () => {
    const merged = new Map(light);
    for (const [k, v] of catalogueDark) merged.set(k, v);
    for (const key of catalogueDark.keys()) {
      const darkVal = dark.get(key);
      expect(darkVal, `dark theme is missing ${key}`).toBeDefined();
      expect(resolveToken(merged.get(key)!, merged), `catalogue-dark ${key} drifted from .dark`).toEqual(
        resolveToken(darkVal!, dark),
      );
    }
  });
});

describe("semantic token contrast", () => {
  for (const theme of ["light", "dark"] as const) {
    describe(theme, () => {
      const results = evaluatePairs(theme === "light" ? light : dark);
      it("resolves every guaranteed pair", () => {
        expect(results).toHaveLength(CONTRAST_PAIRS.length);
        expect(results.every((r) => r.ratio > 0)).toBe(true);
      });
      for (const pair of CONTRAST_PAIRS) {
        it(`${pair.label} meets AA (>= ${pair.min}:1)`, () => {
          const result = results.find((r) => r.label === pair.label)!;
          expect(result.ratio).toBeGreaterThanOrEqual(pair.min);
        });
      }
    });
  }
});
