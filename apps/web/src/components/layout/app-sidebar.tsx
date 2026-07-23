"use client";

import type { NavigationScope } from "@/lib/navigation/registry";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import { NavigationList } from "@/components/layout/navigation-list";
import { useSidebar } from "@/components/layout/sidebar-context";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar({
  workspace,
  scopes = ["workspace"],
  onNavigate,
  collapsible = true,
  activeNavigationId,
}: {
  workspace: string;
  scopes?: NavigationScope[];
  onNavigate?: () => void;
  collapsible?: boolean;
  activeNavigationId?: string;
}) {
  const t = useTranslations();
  const { collapsed: rawCollapsed, setCollapsed } = useSidebar();
  const collapsed = collapsible && rawCollapsed;

  function scopeLabel(scope: NavigationScope) {
    if (scope === "workspace") return t("common.workspace");
    if (scope === "user") return "Your account";
    if (scope === "organisation") return t("nav.organisation");
    return t("common.admin");
  }

  return (
    <aside
      data-collapsed={collapsed}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground"
    >
      <div className="shrink-0 border-b border-sidebar-border/80 p-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                aria-label={t("common.expandSidebar")}
                className="mx-auto flex text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
              >
                <PanelLeftOpen className="size-4" strokeWidth={1.8} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t("common.expandSidebar")}
              <kbd className="font-mono text-xs text-background/60">[</kbd>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <WorkspaceSwitcher workspace={workspace} />
            </div>
            {collapsible ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-sidebar-foreground/50 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                    onClick={() => setCollapsed(true)}
                  >
                    <PanelLeftClose className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    <span className="sr-only">{t("common.collapseSidebar")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t("common.collapseSidebar")}
                  <kbd className="font-mono text-xs text-background/60">[</kbd>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
        {scopes.map((scope, index) => (
          <div key={scope} className={index > 0 ? "mt-5" : undefined}>
            {!collapsed ? (
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/70">
                {scopeLabel(scope)}
              </p>
            ) : null}
            {scopes.length > 1 && collapsed && index > 0 ? (
              <div className="mx-2 mb-2 h-px bg-sidebar-border" aria-hidden="true" />
            ) : null}
            <NavigationList
              scope={scope}
              workspace={workspace}
              onNavigate={onNavigate}
              collapsed={collapsed}
              activeNavigationId={activeNavigationId}
            />
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-sidebar-border/80 p-2">
        <UserMenu compact={collapsed} />
      </div>
    </aside>
  );
}
