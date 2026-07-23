import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CONTRAST_PAIRS, evaluatePairs, parseThemes, resolveToken } from "./contrast";
import { FOUNDATION_TOKEN_NAMES, SEMANTIC_COLOUR_TOKENS } from "./tokens";

/**
 * Deterministic, environment-independent stand-in for pixel visual-regression
 * (which the design plan skipped as flaky). Resolves every semantic token to its
 * final OKLCH value in both themes and records each guaranteed contrast ratio,
 * committed as a snapshot. Any token edit — intended or not — then surfaces as a
 * reviewable text diff instead of only showing up if someone eyeballs /design.
 */

const css = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
const { light, dark } = parseThemes(css);

/** The semantic colour tokens components consume (the `--color-*` layer). */
const SEMANTIC_TOKENS = SEMANTIC_COLOUR_TOKENS.map(([, name]) => name);

type VarMap = ReturnType<typeof parseThemes>["light"];

function formatToken(name: string, vars: VarMap): string {
  const raw = vars.get(name);
  const resolved = raw ? resolveToken(raw, vars) : null;
  if (!resolved) return "<unresolved>";
  const { l, c, h, alpha } = resolved;
  return alpha < 1 ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`;
}

function snapshotTheme(vars: VarMap) {
  const tokens = Object.fromEntries(SEMANTIC_TOKENS.map((name) => [name, formatToken(name, vars)]));
  const contrast = Object.fromEntries(
    evaluatePairs(vars).map((r) => [r.label, `${r.ratio.toFixed(2)}:1 (min ${r.min})`]),
  );
  const foundation = Object.fromEntries(FOUNDATION_TOKEN_NAMES.map((name) => [name, vars.get(name) ?? "<missing>"]));
  return { tokens, foundation, contrast };
}

describe("resolved token snapshot", () => {
  it("light theme is unchanged", () => {
    expect(snapshotTheme(light)).toMatchSnapshot();
  });

  it("dark theme is unchanged", () => {
    expect(snapshotTheme(dark)).toMatchSnapshot();
  });

  it("covers every guaranteed contrast pair", () => {
    // Guards against a pair being dropped from CONTRAST_PAIRS without notice.
    expect(Object.keys(snapshotTheme(light).contrast)).toHaveLength(CONTRAST_PAIRS.length);
  });

  it("declares every foundation token", () => {
    for (const name of FOUNDATION_TOKEN_NAMES) expect(light.get(name), `missing ${name}`).toBeDefined();
  });

  it("catalogues every semantic colour exported to Tailwind", () => {
    const exported = [...css.matchAll(/--color-[\w-]+:\s*var\((--[\w-]+)\)/g)].map((match) => match[1]);
    expect([...new Set(exported)].sort()).toEqual([...SEMANTIC_TOKENS].sort());
  });

  it("catalogues every closed foundation token declared in :root", () => {
    const declared = [...light.keys()].filter((name) => /^(--radius-|--elevation-|--duration-|--ease-|--icon-)/.test(name));
    expect(declared.sort()).toEqual([...FOUNDATION_TOKEN_NAMES].sort());
  });
});
