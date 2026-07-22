/**
 * WCAG contrast utilities for the semantic token layer.
 *
 * Tokens are authored in OKLCH in `globals.css`. This module parses that file
 * (the single source of truth), resolves `var(--…)` references and theme
 * overrides, converts OKLCH → linear sRGB, and computes WCAG 2.x contrast
 * ratios. The `/design` catalogue and the contrast unit test both consume it,
 * so a token edit that breaks contrast fails CI rather than slipping through
 * review.
 */

export type Rgb = { r: number; g: number; b: number };

/** Parse an `oklch(L C H)` / `oklch(L C H / A)` string. Returns null for other syntaxes. */
export function parseOklch(value: string): { l: number; c: number; h: number; alpha: number } | null {
  const match = /oklch\(\s*([^)]+)\)/i.exec(value);
  if (!match || match[1] === undefined) return null;
  const [coordsRaw, alphaPart] = match[1].split("/");
  const [l, c, h] = (coordsRaw ?? "").trim().split(/\s+/).map(Number);
  if (l === undefined || c === undefined || h === undefined || [l, c, h].some((n) => Number.isNaN(n))) return null;
  const alpha = alphaPart === undefined ? 1 : Number(alphaPart.trim());
  return { l, c, h, alpha: Number.isNaN(alpha) ? 1 : alpha };
}

/** OKLCH → linear-light sRGB (values clamped to [0, 1] for out-of-gamut colours). */
export function oklchToLinearSrgb({ l, c, h }: { l: number; c: number; h: number }): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const lCubed = l_ ** 3;
  const mCubed = m_ ** 3;
  const sCubed = s_ ** 3;

  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return {
    r: clamp(4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed),
    g: clamp(-1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed),
    b: clamp(-0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed),
  };
}

/** WCAG relative luminance from linear-light sRGB. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two OKLCH-resolved colours (1–21). */
export function contrastRatio(fg: { l: number; c: number; h: number }, bg: { l: number; c: number; h: number }): number {
  const lumFg = relativeLuminance(oklchToLinearSrgb(fg));
  const lumBg = relativeLuminance(oklchToLinearSrgb(bg));
  const lighter = Math.max(lumFg, lumBg);
  const darker = Math.min(lumFg, lumBg);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Composite a possibly-translucent OKLCH colour over an opaque backdrop. */
function flattenOver(fg: { l: number; c: number; h: number; alpha: number }, bg: Rgb): Rgb {
  if (fg.alpha >= 1) return oklchToLinearSrgb(fg);
  const top = oklchToLinearSrgb(fg);
  return {
    r: top.r * fg.alpha + bg.r * (1 - fg.alpha),
    g: top.g * fg.alpha + bg.g * (1 - fg.alpha),
    b: top.b * fg.alpha + bg.b * (1 - fg.alpha),
  };
}

/** Contrast ratio from linear-sRGB colours (used after alpha compositing). */
export function contrastRatioRgb(fg: Rgb, bg: Rgb): number {
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

type VarMap = Map<string, string>;

/** Extract `--name: value;` declarations from the first block matching a selector. */
function readBlock(css: string, selectorPattern: RegExp): VarMap {
  const map: VarMap = new Map();
  const block = selectorPattern.exec(css);
  if (!block || block[1] === undefined) return map;
  for (const decl of block[1].split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const name = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (name.startsWith("--")) map.set(name, val);
  }
  return map;
}

/** Resolve a token value to OKLCH, following `var(--…)` chains within a theme. */
export function resolveToken(value: string, vars: VarMap, depth = 0): { l: number; c: number; h: number; alpha: number } | null {
  if (depth > 12) return null;
  const varRef = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value.trim());
  if (varRef && varRef[1] !== undefined) {
    const next = vars.get(varRef[1]);
    return next === undefined ? null : resolveToken(next, vars, depth + 1);
  }
  return parseOklch(value);
}

/** Build resolved light/dark theme variable maps from `globals.css` contents. */
export function parseThemes(css: string): { light: VarMap; dark: VarMap } {
  // Strip comments first: a colon inside `/* … */` would otherwise be mistaken
  // for a declaration separator and drop the token that follows it.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const root = readBlock(clean, /:root\s*\{([^}]*)\}/);
  const darkOverrides = readBlock(clean, /\.dark,\s*\.catalogue-dark\s*\{([^}]*)\}/);
  const dark: VarMap = new Map(root);
  for (const [k, v] of darkOverrides) dark.set(k, v);
  return { light: root, dark };
}

export type ContrastPair = {
  /** Semantic label shown in the catalogue. */
  label: string;
  /** Foreground token name, e.g. `--foreground`. */
  fg: string;
  /** Background token name it renders against. */
  bg: string;
  /** Minimum acceptable ratio: 4.5 for body/label text, 3 for UI fills/large text. */
  min: number;
};

/**
 * The pairs the design system guarantees. Text pairs demand AA normal (4.5);
 * UI accents and status fills demand AA non-text / large-text (3.0). Translucent
 * tokens (borders/rings) are compositional and excluded — they are not text.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { label: "Body text", fg: "--foreground", bg: "--background", min: 4.5 },
  { label: "Muted text", fg: "--muted-foreground", bg: "--background", min: 4.5 },
  { label: "Muted text on muted", fg: "--muted-foreground", bg: "--muted", min: 4.5 },
  { label: "Card text", fg: "--card-foreground", bg: "--card", min: 4.5 },
  { label: "Popover text", fg: "--popover-foreground", bg: "--popover", min: 4.5 },
  { label: "Primary button text", fg: "--primary-foreground", bg: "--primary", min: 4.5 },
  { label: "Secondary text", fg: "--secondary-foreground", bg: "--secondary", min: 4.5 },
  { label: "Accent text", fg: "--accent-foreground", bg: "--accent", min: 4.5 },
  { label: "Sidebar text", fg: "--sidebar-foreground", bg: "--sidebar", min: 4.5 },
  { label: "Sidebar active text", fg: "--sidebar-primary-foreground", bg: "--sidebar-primary", min: 4.5 },
  { label: "Error text", fg: "--destructive", bg: "--background", min: 4.5 },
  { label: "Success accent", fg: "--success", bg: "--background", min: 3 },
  { label: "Warning accent", fg: "--warning", bg: "--background", min: 3 },
  { label: "Info accent", fg: "--info", bg: "--background", min: 3 },
  { label: "Primary accent", fg: "--primary", bg: "--background", min: 3 },
];

export type ContrastResult = ContrastPair & { ratio: number; passes: boolean };

/** Evaluate every guaranteed pair against one resolved theme. */
export function evaluatePairs(vars: VarMap): ContrastResult[] {
  return CONTRAST_PAIRS.map((pair) => {
    const fg = vars.get(pair.fg);
    const bg = vars.get(pair.bg);
    const fgColor = fg ? resolveToken(fg, vars) : null;
    const bgColor = bg ? resolveToken(bg, vars) : null;
    if (!fgColor || !bgColor) {
      return { ...pair, ratio: 0, passes: false };
    }
    // Backgrounds are opaque; a translucent foreground composites over it.
    const bgRgb = oklchToLinearSrgb(bgColor);
    const fgRgb = flattenOver(fgColor, bgRgb);
    const ratio = contrastRatioRgb(fgRgb, bgRgb);
    return { ...pair, ratio, passes: ratio >= pair.min };
  });
}
