"use client";

import { Bell, HelpCircle, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { useKeyboardShortcuts } from "@/components/layout/keyboard-shortcuts-provider";
import { ModelSwitcher } from "@/components/layout/model-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavigationScope } from "@/lib/navigation/registry";

export function TopBar({
  workspace,
  scopes,
  activeNavigationId,
}: {
  workspace: string;
  scopes: NavigationScope[];
  activeNavigationId?: string;
}) {
  const t = useTranslations();
  const { commandOpen, setCommandOpen, setHelpOpen } = useKeyboardShortcuts();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border/70 bg-background/90 px-3 backdrop-blur-xl transition-colors duration-(--duration-slow) md:px-4">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="md:hidden">
            <Menu className="size-4" aria-hidden="true" />
            <span className="sr-only">{t("common.openNavigation")}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-0 border-0 p-0">
          <SheetTitle className="sr-only">{t("common.openNavigation")}</SheetTitle>
          <SheetDescription className="sr-only">{t("brand.description")}</SheetDescription>
          <AppSidebar
            workspace={workspace}
            scopes={scopes}
            activeNavigationId={activeNavigationId}
            onNavigate={() => setMobileOpen(false)}
            collapsible={false}
          />
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        className="h-8 min-w-0 flex-1 justify-start gap-2 border border-transparent bg-muted/45 px-2.5 text-xs font-normal text-muted-foreground hover:border-border/70 hover:bg-muted/70 data-[state=open]:border-border/70 data-[state=open]:bg-muted/70 sm:max-w-xs"
        aria-haspopup="dialog"
        aria-expanded={commandOpen}
        data-state={commandOpen ? "open" : "closed"}
        onClick={() => setCommandOpen(true)}
      >
        <Search className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
        <span className="truncate">{t("shell.searchHint")}</span>
        <kbd className="ml-auto hidden rounded border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono text-xs leading-none text-muted-foreground/80 sm:inline">
          {t("shell.searchShortcut")}
        </kbd>
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <ModelSwitcher />
        <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => setHelpOpen(true)}>
              <HelpCircle className="size-4" strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">{t("common.help")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.help")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={resolvedTheme === "dark"}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <span className="relative size-4" aria-hidden="true">
                <Moon className="absolute inset-0 size-4 rotate-0 scale-100 transition-transform duration-(--duration-slow) ease-(--ease-fluid) dark:rotate-90 dark:scale-0" strokeWidth={1.8} />
                <Sun className="absolute inset-0 size-4 -rotate-90 scale-0 transition-transform duration-(--duration-slow) ease-(--ease-fluid) dark:rotate-0 dark:scale-100" strokeWidth={1.8} />
              </span>
              <span className="sr-only">{t("common.toggleTheme")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.toggleTheme")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative">
              <Bell className="size-4" strokeWidth={1.8} aria-hidden="true" />
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary ring-2 ring-background" aria-hidden="true" />
              <span className="sr-only">3</span>
              <span className="sr-only">{t("common.openNotifications")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("common.notifications")}</TooltipContent>
        </Tooltip>
        <div className="ml-0.5 hidden sm:block">
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
}
