/**
 * The spacing steps (Tailwind scale, where rem = step × 0.25) that product code
 * may use. Single source of truth for both the `/design` spacing specimen and
 * the `no-off-scale-spacing` ESLint rule; a parity test (`scale.test.ts`) keeps
 * the rule's inlined copy in sync. Fine half-steps (0.5–3.5) are included
 * because the UI genuinely uses them for tight rhythm; the coarse tail
 * (5,6,8,10,12) covers section spacing. Anything off this set fails lint.
 */
export const SPACING_STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12] as const;
