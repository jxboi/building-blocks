import { readFileSync } from "node:fs";
import path from "node:path";

import { evaluatePairs, parseThemes, type ContrastResult } from "./contrast";

/**
 * Reads `globals.css` and evaluates the guaranteed contrast pairs for both
 * themes. Server-only by construction (uses `node:fs`); consumed by the
 * dev-gated `/design` catalogue so the token page always shows live ratios.
 * Defensive: a read failure yields empty results rather than crashing the page.
 */
export function readContrastAudit(): { light: ContrastResult[]; dark: ContrastResult[] } {
  try {
    const css = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const { light, dark } = parseThemes(css);
    return { light: evaluatePairs(light), dark: evaluatePairs(dark) };
  } catch {
    return { light: [], dark: [] };
  }
}
