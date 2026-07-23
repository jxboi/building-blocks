import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  detail,
  trend = "up",
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
}) {
  const TrendIcon = trend === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="group bg-card px-4 py-4 transition-colors duration-(--duration-fast) hover:bg-muted/25 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon
          className="size-3.5 text-muted-foreground/65 transition-colors group-hover:text-foreground/65"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </p>
      <p
        className={cn(
          "mt-2.5 flex items-center gap-1 text-xs text-muted-foreground",
          trend === "up" && "text-success",
          trend === "down" && "text-destructive",
        )}
      >
        {trend !== "neutral" ? <TrendIcon className="size-3" strokeWidth={1.8} aria-hidden="true" /> : null}
        {detail}
      </p>
    </div>
  );
}
