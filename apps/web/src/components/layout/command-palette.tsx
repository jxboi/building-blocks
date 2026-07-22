"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useKeyboardShortcuts } from "@/components/layout/keyboard-shortcuts-provider";
import { navigationRegistry, resolveHref } from "@/lib/navigation/registry";

export function CommandPalette({ workspace }: { workspace: string }) {
  const { commandOpen, setCommandOpen } = useKeyboardShortcuts();
  const router = useRouter();
  const t = useTranslations();

  function navigate(href: string) {
    setCommandOpen(false);
    router.push(href as Route);
  }

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      title={t("common.openCommandPalette")}
      description={t("shell.searchHint")}
    >
      <CommandInput placeholder={t("shell.searchHint")} />
      <CommandList>
        <CommandEmpty>{t("common.noResults")}</CommandEmpty>
        <CommandGroup heading={t("common.workspace")}>
          {navigationRegistry
            .filter((item) => item.scope === "workspace")
            .map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.id} ${t(item.labelKey)}`}
                onSelect={() => navigate(resolveHref(item, workspace))}
              >
                <item.icon className="size-4" aria-hidden={true} />
                <span>{t(item.labelKey)}</span>
                {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
              </CommandItem>
            ))}
        </CommandGroup>
        <CommandGroup heading={t("common.settings")}>
          {navigationRegistry
            .filter((item) => item.scope === "user" || item.scope === "organisation")
            .slice(0, 7)
            .map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.id} ${t(item.labelKey)}`}
                onSelect={() => navigate(resolveHref(item, workspace))}
              >
                <item.icon className="size-4" aria-hidden={true} />
                <span>{t(item.labelKey)}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
