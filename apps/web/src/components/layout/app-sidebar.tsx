"use client";

import type { NavigationScope } from "@/lib/navigation/registry";
import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/layout/brand-mark";
import { NavigationList } from "@/components/layout/navigation-list";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";

export function AppSidebar({
  workspace,
  scopes = ["workspace"],
  onNavigate,
}: {
  workspace: string;
  scopes?: NavigationScope[];
  onNavigate?: () => void;
}) {
  const t = useTranslations();

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 shrink-0 items-center gap-2 px-3">
        <BrandMark className="size-7 rounded-md shadow-none [&_svg]:size-4" />
        <p className="truncate text-sm font-semibold tracking-tight">{t("brand.name")}</p>
      </div>
      <div className="px-2 pb-2">
        <WorkspaceSwitcher workspace={workspace} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {scopes.map((scope, index) => (
          <div key={scope} className={index > 0 ? "mt-5" : undefined}>
            {scopes.length > 1 ? (
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/35">
                {scope === "user" ? "Your account" : scope}
              </p>
            ) : null}
            <NavigationList scope={scope} workspace={workspace} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
      <div className="border-t border-sidebar-border p-2">
        <UserMenu />
      </div>
    </aside>
  );
}
