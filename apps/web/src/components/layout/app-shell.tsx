import type { NavigationScope } from "@/lib/navigation/registry";

import { AppShellFrame } from "@/components/layout/app-shell-frame";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { HelpDialog } from "@/components/layout/help-dialog";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({
  children,
  workspace = "acme",
  scopes = ["workspace"],
  activeNavigationId,
}: {
  children: React.ReactNode;
  workspace?: string;
  scopes?: NavigationScope[];
  activeNavigationId?: string;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background">
        <AppShellFrame
          sidebar={
            <AppSidebar
              workspace={workspace}
              scopes={scopes}
              activeNavigationId={activeNavigationId}
            />
          }
          topBar={
            <TopBar
              workspace={workspace}
              scopes={scopes}
              activeNavigationId={activeNavigationId}
            />
          }
        >
          {children}
        </AppShellFrame>
        <CommandPalette workspace={workspace} />
        <HelpDialog />
      </div>
    </SidebarProvider>
  );
}
