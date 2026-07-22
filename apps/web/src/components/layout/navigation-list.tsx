"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeature } from "@/lib/features/feature-context";
import {
  type NavigationItem,
  type NavigationScope,
  navItemsForScope,
  resolveHref,
} from "@/lib/navigation/registry";
import { useCan } from "@/lib/permissions/permission-context";
import { cn } from "@/lib/utils";

function NavigationLink({
  item,
  workspace,
  onNavigate,
}: {
  item: NavigationItem;
  workspace: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const feature = useFeature(item.featureKey);
  const canView = useCan(item.permission);
  const href = resolveHref(item, workspace);
  const active = pathname === href;
  const label = t(item.labelKey);

  if (!feature.enabled || !feature.organisationEnabled) return null;

  if (!feature.entitled || !canView) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="flex min-h-8 cursor-not-allowed items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground/35"
            aria-disabled="true"
          >
            <item.icon className="size-3.5" aria-hidden={true} />
            <span>{label}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          {feature.entitled ? "Additional permission required" : "Available on another plan"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={href as Route}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground/60 transition-[background-color,color] duration-150 ease-out hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus-visible:outline-sidebar-ring",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <item.icon
        className={cn(
          "size-3.5 text-sidebar-foreground/42 transition-colors duration-150 group-hover:text-sidebar-accent-foreground/75",
          active && "text-sidebar-accent-foreground/70",
        )}
        aria-hidden={true}
      />
      <span>{label}</span>
      {item.shortcut ? (
        <span className="ml-auto font-mono text-xs tracking-wide text-sidebar-foreground/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {item.shortcut}
        </span>
      ) : null}
    </Link>
  );
}

export function NavigationList({
  scope,
  workspace,
  onNavigate,
}: {
  scope: NavigationScope;
  workspace: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-0.5" aria-label={`${scope} navigation`}>
      {navItemsForScope(scope).map((item) => (
        <NavigationLink
          key={item.id}
          item={item}
          workspace={workspace}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
