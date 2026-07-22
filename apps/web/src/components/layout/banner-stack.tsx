"use client";

import { CreditCard, FlaskConical, Megaphone, RefreshCw, TriangleAlert, UserRoundCog, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { DemoRefreshButton } from "@/components/layout/demo-refresh-button";
import { Button } from "@/components/ui/button";
import {
  BANNER_META,
  resolveBanners,
  type BannerActive,
  type BannerKind,
  type BannerSeverity,
} from "@/lib/layout/banners";
import { cn } from "@/lib/utils";

const kindIcon: Record<BannerKind, LucideIcon> = {
  impersonation: UserRoundCog,
  readOnly: CreditCard,
  demo: FlaskConical,
  versionRefresh: RefreshCw,
  announcement: Megaphone,
  degraded: TriangleAlert,
};

const severityClass: Record<BannerSeverity, string> = {
  info: "border-info/20 bg-info/10 text-info",
  warning: "border-warning/20 bg-warning/10 text-warning",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
};

export type BannerStackLabels = {
  dismiss: string;
  reload: string;
  more: string;
  demoRefresh: string;
  demoRefreshing: string;
};

/**
 * The single stacked banner slot. Renders the two highest-priority active
 * banners plus a collapsed indicator, honouring per-kind dismissal (in-session;
 * per-user persistence rides the settings registry when it lands).
 */
export function BannerStack({ banners, labels }: { banners: readonly BannerActive[]; labels: BannerStackLabels }) {
  const [dismissed, setDismissed] = useState<BannerKind[]>([]);
  const { visible, hiddenCount } = resolveBanners(banners, dismissed);

  if (visible.length === 0) return null;

  return (
    <div>
      {visible.map((banner) => {
        const meta = BANNER_META[banner.kind];
        const Icon = kindIcon[banner.kind];
        return (
          <div
            key={banner.kind}
            className={cn("flex items-center gap-2.5 border-b px-4 py-1.5 text-xs md:px-6", severityClass[meta.severity])}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate">
              <span className="font-medium">{banner.message}</span>
              {banner.description ? <span className="font-normal"> {banner.description}</span> : null}
            </p>
            {banner.kind === "demo" ? <DemoRefreshButton label={labels.demoRefresh} busyLabel={labels.demoRefreshing} /> : null}
            {banner.kind === "versionRefresh" ? (
              <Button variant="ghost" size="xs" className="text-current" onClick={() => window.location.reload()}>
                {labels.reload}
              </Button>
            ) : null}
            {meta.dismissible ? (
              <Button
                variant="ghost"
                size="icon-xs"
                className="-mr-1 text-current"
                aria-label={labels.dismiss}
                onClick={() => setDismissed((current) => (current.includes(banner.kind) ? current : [...current, banner.kind]))}
              >
                <X className="size-3" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        );
      })}
      {hiddenCount > 0 ? (
        <div className="border-b bg-muted/30 px-4 py-1 text-xs text-muted-foreground md:px-6">
          +{hiddenCount} {labels.more}
        </div>
      ) : null}
    </div>
  );
}
