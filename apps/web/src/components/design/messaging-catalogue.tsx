"use client";

import { BannerStack, type BannerStackLabels } from "@/components/layout/banner-stack";
import { Button } from "@/components/ui/button";
import type { BannerActive } from "@/lib/layout/banners";
import { notify } from "@/lib/notify";

const labels: BannerStackLabels = {
  dismiss: "Dismiss",
  reload: "Refresh",
  more: "more",
  demoRefresh: "Refresh",
  demoRefreshing: "Refreshing…",
};

const pair: BannerActive[] = [
  { kind: "impersonation", message: "Viewing as Maya Chen", description: "All actions are audited." },
  { kind: "announcement", message: "Scheduled maintenance Sunday 02:00 UTC." },
];

const overflowing: BannerActive[] = [
  { kind: "impersonation", message: "Viewing as Maya Chen" },
  { kind: "readOnly", message: "Payment failed — workspace is read-only." },
  { kind: "demo", message: "Demo workspace", description: "Changes reset periodically." },
  { kind: "announcement", message: "New: saved views for every list." },
];

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-lg border">{children}</div>;
}

export function MessagingCatalogue() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          One stacked slot, fixed priority order, at most two visible. Non-dismissible conditions (impersonation, read-only)
          can never be hidden; dismissible ones show a close control.
        </p>
        <Frame>
          <BannerStack banners={pair} labels={labels} />
        </Frame>
        <Frame>
          <BannerStack banners={overflowing} labels={labels} />
        </Frame>
      </div>
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          Toasts are transient feedback about an action just taken — always via the <code className="font-mono text-xs">notify</code> helper.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => notify.success("Workspace saved")}>
            Success
          </Button>
          <Button variant="outline" onClick={() => notify.error("Could not save workspace", { correlationId: "a1b2c3d4" })}>
            Error with reference
          </Button>
          <Button variant="outline" onClick={() => notify.undo("Task archived", { onUndo: () => notify.success("Restored") })}>
            Undo
          </Button>
        </div>
      </div>
    </div>
  );
}
