"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoRefreshButton({
  label,
  busyLabel,
}: {
  label: string;
  busyLabel: string;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isRefreshing) return;
    const timeout = window.setTimeout(() => setIsRefreshing(false), 800);
    return () => window.clearTimeout(timeout);
  }, [isRefreshing]);

  return (
    <Button
      variant="ghost"
      size="xs"
      className="hidden min-w-24 justify-start disabled:opacity-70 sm:inline-flex"
      disabled={isRefreshing}
      aria-busy={isRefreshing}
      aria-live="polite"
      onClick={() => setIsRefreshing(true)}
    >
      <RefreshCw
        className={cn("size-3.5 transition-transform duration-(--duration-slow)", isRefreshing && "animate-spin")}
        aria-hidden="true"
      />
      <span key={isRefreshing ? "busy" : "idle"} className="state-enter">
        {isRefreshing ? busyLabel : label}
      </span>
    </Button>
  );
}
