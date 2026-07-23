"use client";

import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

export function AppShellFrame({
  sidebar,
  topBar,
  children,
}: {
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <>
      <div
        data-collapsed={collapsed}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-(--duration-slow) ease-(--ease-fluid) md:block",
          collapsed ? "w-14" : "w-60",
        )}
      >
        {sidebar}
      </div>
      <div
        className={cn(
          "min-w-0 transition-[padding] duration-(--duration-slow) ease-(--ease-fluid)",
          // Offsets mirror the fixed sidebar width (w-14 / w-60), so these are
          // layout dimensions, not spacing rhythm — off the spacing scale by design.
          // eslint-disable-next-line building-blocks/no-off-scale-spacing
          collapsed ? "md:pl-14" : "md:pl-60",
        )}
      >
        {topBar}
        <main>{children}</main>
      </div>
    </>
  );
}
