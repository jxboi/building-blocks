import { getTranslations } from "next-intl/server";

import { BannerStack, type BannerStackLabels } from "@/components/layout/banner-stack";
import type { BannerActive } from "@/lib/layout/banners";

/**
 * Server entry point for the banner slot. Assembles the active app-level
 * conditions (demo mode today; impersonation, read-only, announcements, and
 * degraded-service banners are passed in by their owning modules) and hands
 * them to the client `BannerStack`, which owns priority, collapsing, and
 * dismissal.
 */
export async function BannerSlot({ demo = false, banners = [] }: { demo?: boolean; banners?: BannerActive[] }) {
  const t = await getTranslations();

  const active: BannerActive[] = [...banners];
  if (demo) {
    active.push({ kind: "demo", message: t("shell.demoBanner"), description: t("shell.demoBannerDescription") });
  }
  if (active.length === 0) return null;

  const labels: BannerStackLabels = {
    dismiss: t("shell.dismiss"),
    reload: t("shell.reloadPage"),
    more: t("shell.bannersCollapsed"),
    demoRefresh: t("shell.refresh"),
    demoRefreshing: t("shell.refreshing"),
  };

  return <BannerStack banners={active} labels={labels} />;
}
