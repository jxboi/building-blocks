import type { NavigationScope } from "@/lib/navigation/registry";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { HelpDialog } from "@/components/layout/help-dialog";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({
  children,
  workspace = "acme",
  scopes = ["workspace"],
}: {
  children: React.ReactNode;
  workspace?: string;
  scopes?: NavigationScope[];
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-sidebar-border md:block">
        <AppSidebar workspace={workspace} scopes={scopes} />
      </div>
      <div className="min-w-0 md:pl-60">
        <TopBar workspace={workspace} scopes={scopes} />
        <main>{children}</main>
      </div>
      <CommandPalette workspace={workspace} />
      <HelpDialog />
    </div>
  );
}
