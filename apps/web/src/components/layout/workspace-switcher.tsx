"use client";

import type { Route } from "next";
import { Check, ChevronsUpDown, Plus, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const workspaces = [
  { slug: "acme", name: "Product", organisation: "Acme Studio", selected: true },
  { slug: "labs", name: "Labs", organisation: "Acme Studio", selected: false },
] as const;

export function WorkspaceSwitcher({
  workspace,
  collapsed = false,
}: {
  workspace: string;
  collapsed?: boolean;
}) {
  const t = useTranslations("shell");
  const router = useRouter();
  const selected = workspaces.find((item) => item.slug === workspace) ?? workspaces[0];

  const avatar = (
    <span className="flex size-7 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent font-mono text-xs font-semibold text-sidebar-primary">
      AC
    </span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto flex text-sidebar-foreground hover:bg-sidebar-accent/70"
            aria-label={`${t("workspaceLabel")}: ${selected.name}`}
          >
            {avatar}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-2 border-sidebar-border/80 bg-sidebar-accent/30 px-1.5 py-1.5 text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent/70"
          >
            {avatar}
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium leading-4">{selected.name}</span>
              <span className="block truncate text-xs leading-3.5 text-sidebar-foreground/70">{selected.organisation}</span>
            </span>
            <ChevronsUpDown className="size-3 text-sidebar-foreground/35" aria-hidden="true" />
            <span className="sr-only">{t("workspaceLabel")}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={collapsed ? "right" : "bottom"}
        sideOffset={8}
        className="w-64"
      >
        <DropdownMenuLabel>{t("organisationName")}</DropdownMenuLabel>
        <DropdownMenuGroup>
          {workspaces.map((item) => (
            <DropdownMenuItem
              key={item.slug}
              onSelect={() => router.push(`/${item.slug}` as Route)}
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-muted font-mono text-xs">
                {item.name.slice(0, 2).toUpperCase()}
              </span>
              {item.name}
              {item.slug === selected.slug ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="size-4" />
          Create workspace
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings/organisation")}>
          <Settings2 className="size-4" />
          Organisation settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
