import { Blocks } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <Blocks className="size-5" />
    </span>
  );
}
