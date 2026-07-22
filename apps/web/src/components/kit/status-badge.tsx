import { CircleAlert, CircleCheck, CircleDashed, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ShellStatus = "active" | "pending" | "draft" | "blocked" | "complete";

const statusConfig = {
  active: { label: "Active", icon: CircleCheck, className: "border-success/25 bg-success/10 text-success" },
  pending: { label: "Pending", icon: Clock3, className: "border-warning/25 bg-warning/10 text-warning" },
  draft: { label: "Draft", icon: CircleDashed, className: "border-border bg-muted text-muted-foreground" },
  blocked: { label: "Blocked", icon: CircleAlert, className: "border-destructive/25 bg-destructive/10 text-destructive" },
  complete: { label: "Complete", icon: CircleCheck, className: "border-border bg-muted/70 text-foreground/70" },
} satisfies Record<ShellStatus, { label: string; icon: typeof CircleCheck; className: string }>;

export function StatusBadge({ status }: { status: ShellStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5", config.className)}>
      <config.icon className="size-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
