"use client";

import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeature } from "@/lib/features/feature-context";
import {
  type NavigationItem,
  type NavigationScope,
  type NavigationSubItem,
  navItemsForScope,
  resolveHref,
} from "@/lib/navigation/registry";
import { useCan } from "@/lib/permissions/permission-context";
import { cn } from "@/lib/utils";

function hrefOf(href: NavigationSubItem["href"], workspace: string) {
  return typeof href === "function" ? href(workspace) : href;
}

const linkClass =
  "group relative flex min-h-9 items-center gap-2 rounded-md px-1.5 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-(--duration-fast) ease-(--ease-fluid) hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus-visible:outline-sidebar-ring";

function NavigationBadge({ value, collapsed }: { value: string; collapsed: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary/10 px-1.5 font-mono text-xs font-semibold leading-none text-sidebar-primary",
        collapsed && "absolute right-1 top-1 size-1.5 min-w-0 bg-sidebar-primary p-0 leading-none ring-2 ring-sidebar",
      )}
      aria-hidden={collapsed}
    >
      {collapsed ? null : value}
    </span>
  );
}

function NavigationLink({
  item,
  workspace,
  onNavigate,
  collapsed = false,
  activeNavigationId,
}: {
  item: NavigationItem;
  workspace: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  activeNavigationId?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const feature = useFeature(item.featureKey);
  const canView = useCan(item.permission);
  const href = resolveHref(item, workspace);
  const active = activeNavigationId === item.id || pathname === href;
  const label = t(item.labelKey);

  if (!feature.enabled || !feature.organisationEnabled) return null;

  if (!feature.entitled || !canView) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "flex min-h-9 cursor-not-allowed items-center gap-2 rounded-md px-1.5 text-sm text-sidebar-foreground/40",
              collapsed && "justify-center px-1",
            )}
            aria-disabled="true"
            aria-label={collapsed ? label : undefined}
          >
            <item.icon className="size-4" aria-hidden={true} />
            {!collapsed ? <span>{label}</span> : null}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          {feature.entitled ? "Additional permission required" : "Available on another plan"}
        </TooltipContent>
      </Tooltip>
    );
  }

  const link = (
    <Link
      href={href as Route}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? `${label}${item.badge ? `, ${item.badge} items` : ""}` : undefined}
      className={cn(
        linkClass,
        collapsed && "justify-center px-1",
        active && "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-inset ring-sidebar-border",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-[background-color,color] duration-(--duration-fast) group-hover:text-sidebar-accent-foreground",
          active && "bg-sidebar-primary text-sidebar-primary-foreground",
        )}
      >
        <item.icon className="size-4" strokeWidth={1.8} aria-hidden={true} />
      </span>
      {!collapsed ? <span>{label}</span> : null}
      {!collapsed && item.badge ? (
        <span className="ml-auto flex h-6 shrink-0 items-center">
          <NavigationBadge value={item.badge} collapsed={false} />
        </span>
      ) : null}
      {!collapsed && item.shortcut && !item.badge ? (
        <span className="ml-auto font-mono text-xs tracking-wide text-sidebar-foreground/45 opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100">
          {item.shortcut}
        </span>
      ) : null}
      {collapsed && item.badge ? <NavigationBadge value={item.badge} collapsed /> : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="gap-2">
          {label}
          {item.shortcut ? (
            <kbd className="font-mono text-xs text-background/60">{item.shortcut}</kbd>
          ) : null}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function NavigationGroup({
  item,
  workspace,
  onNavigate,
  activeNavigationId,
}: {
  item: NavigationItem;
  workspace: string;
  onNavigate?: () => void;
  activeNavigationId?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const feature = useFeature(item.featureKey);
  const canView = useCan(item.permission);
  const href = resolveHref(item, workspace);
  const label = t(item.labelKey);
  const parentActive = activeNavigationId === item.id || pathname === href;
  const [open, setOpen] = useState(parentActive);

  if (!feature.enabled || !feature.organisationEnabled) return null;
  if (!feature.entitled || !canView) {
    return (
      <NavigationLink
        item={item}
        workspace={workspace}
        onNavigate={onNavigate}
        activeNavigationId={activeNavigationId}
      />
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
        className={cn(
          linkClass,
          "w-full cursor-pointer text-left",
          parentActive && "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-inset ring-sidebar-border",
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-[background-color,color] duration-(--duration-fast) group-hover:text-sidebar-accent-foreground",
            parentActive && "bg-sidebar-primary text-sidebar-primary-foreground",
          )}
        >
          <item.icon className="size-4" strokeWidth={1.8} aria-hidden={true} />
        </span>
        <span>{label}</span>
        {item.badge ? (
          <span className="ml-auto flex h-6 shrink-0 items-center">
            <NavigationBadge value={item.badge} collapsed={false} />
          </span>
        ) : null}
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-sidebar-foreground/55 transition-transform duration-(--duration-slow)",
            !item.badge && "ml-auto",
            open && "rotate-90",
          )}
          aria-hidden={true}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-2.5">
          {item.children?.map((child) => {
            const childHref = hrefOf(child.href, workspace);
            return (
              <li key={child.id}>
                <Link
                  href={childHref as Route}
                  onClick={onNavigate}
                  className="group flex min-h-8 items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground/70 transition-colors duration-(--duration-fast) hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:outline-sidebar-ring"
                >
                  <span>{t(child.labelKey)}</span>
                  {child.badge ? (
                    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sidebar-accent px-1.5 font-mono text-xs leading-none text-sidebar-accent-foreground/80">
                      {child.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavigationEntry({
  item,
  workspace,
  onNavigate,
  collapsed,
  activeNavigationId,
}: {
  item: NavigationItem;
  workspace: string;
  onNavigate?: () => void;
  collapsed: boolean;
  activeNavigationId?: string;
}) {
  if (item.children && item.children.length > 0 && !collapsed) {
    return (
      <NavigationGroup
        item={item}
        workspace={workspace}
        onNavigate={onNavigate}
        activeNavigationId={activeNavigationId}
      />
    );
  }
  return (
    <NavigationLink
      item={item}
      workspace={workspace}
      onNavigate={onNavigate}
      collapsed={collapsed}
      activeNavigationId={activeNavigationId}
    />
  );
}

export function NavigationList({
  scope,
  workspace,
  onNavigate,
  collapsed = false,
  activeNavigationId,
}: {
  scope: NavigationScope;
  workspace: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  activeNavigationId?: string;
}) {
  return (
    <nav className="grid gap-0.5" aria-label={`${scope} navigation`}>
      {navItemsForScope(scope).map((item) => (
        <NavigationEntry
          key={item.id}
          item={item}
          workspace={workspace}
          onNavigate={onNavigate}
          collapsed={collapsed}
          activeNavigationId={activeNavigationId}
        />
      ))}
    </nav>
  );
}
