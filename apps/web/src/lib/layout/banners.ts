/**
 * App/page-level banner model: a single stacked slot with a fixed priority
 * order, at most two visible at once (the rest collapse into an indicator), and
 * per-kind dismissal rules. This is the pure, testable core; `BannerStack`
 * renders it. Toasts, inline alerts, tooltips, and modals are separate surfaces
 * (see the messaging-surface hierarchy in the nextjs plan) — this is only for
 * persistent, app-level conditions.
 */

export type BannerKind =
  | "impersonation"
  | "readOnly"
  | "demo"
  | "versionRefresh"
  | "announcement"
  | "degraded";

export type BannerSeverity = "info" | "warning" | "danger";

/** Fixed priority order, highest first. Index is the priority. */
export const BANNER_ORDER: readonly BannerKind[] = [
  "impersonation",
  "readOnly",
  "demo",
  "versionRefresh",
  "announcement",
  "degraded",
];

/** At most this many banners render; the remainder collapse into an indicator. */
export const MAX_VISIBLE_BANNERS = 2;

export const BANNER_META: Record<BannerKind, { severity: BannerSeverity; dismissible: boolean }> = {
  // Impersonation must never be dismissible — the operator always sees they are acting as someone else.
  impersonation: { severity: "warning", dismissible: false },
  // Payment failure puts the workspace in read-only mode — a hard condition, not dismissible.
  readOnly: { severity: "danger", dismissible: false },
  demo: { severity: "info", dismissible: false },
  versionRefresh: { severity: "info", dismissible: true },
  announcement: { severity: "info", dismissible: true },
  // Degraded service clears itself when health recovers; there is nothing to dismiss.
  degraded: { severity: "warning", dismissible: false },
};

export type BannerActive = {
  kind: BannerKind;
  message: string;
  description?: string;
};

export type ResolvedBanners = {
  /** In priority order, at most MAX_VISIBLE_BANNERS. */
  visible: BannerActive[];
  /** How many active banners are collapsed behind the indicator. */
  hiddenCount: number;
};

function priorityOf(kind: BannerKind): number {
  const index = BANNER_ORDER.indexOf(kind);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Sort active banners by priority, drop dismissed ones (only where the kind
 * permits dismissal), de-duplicate by kind, and split into visible + collapsed.
 * Dismissing a non-dismissible kind is a no-op, so impersonation and read-only
 * can never be hidden by the user.
 */
export function resolveBanners(
  active: readonly BannerActive[],
  dismissed: readonly BannerKind[] = [],
): ResolvedBanners {
  const dismissedSet = new Set(dismissed);
  const shown = active
    .filter((banner, index, all) => all.findIndex((other) => other.kind === banner.kind) === index)
    .filter((banner) => !(BANNER_META[banner.kind].dismissible && dismissedSet.has(banner.kind)))
    .sort((a, b) => priorityOf(a.kind) - priorityOf(b.kind));

  return {
    visible: shown.slice(0, MAX_VISIBLE_BANNERS),
    hiddenCount: Math.max(0, shown.length - MAX_VISIBLE_BANNERS),
  };
}
