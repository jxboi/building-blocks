"use client";

import {
  Command,
  ChevronsUpDown,
  CreditCard,
  LifeBuoy,
  LogOut,
  MonitorCog,
  Moon,
  Palette,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useKeyboardShortcuts } from "@/components/layout/keyboard-shortcuts-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

const otherAccounts = [
  { initials: "AL", name: "Ada Lovelace", email: "ada@acme.example", current: true },
  { initials: "GH", name: "Grace Hopper", email: "grace@navy.example", current: false },
] as const;

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { setCommandOpen } = useKeyboardShortcuts();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            compact
              ? "mx-auto flex size-8 rounded-full p-0"
              : "h-auto w-full justify-start gap-2 border-sidebar-border/80 bg-sidebar-accent/25 px-1.5 py-1.5 text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent/70"
          }
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-accent font-mono text-xs font-semibold text-accent-foreground">
              AL
            </AvatarFallback>
          </Avatar>
          {!compact ? (
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium leading-4">{t("shell.userName")}</span>
              <span className="block truncate text-xs leading-3.5 text-sidebar-foreground/70">
                {t("shell.userEmail")}
              </span>
            </span>
          ) : null}
          {!compact ? (
            <ChevronsUpDown className="size-3 text-sidebar-foreground/45" aria-hidden="true" />
          ) : null}
          <span className="sr-only">{t("common.openMenu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <Avatar className="size-9">
            <AvatarFallback className="bg-accent font-mono text-xs font-semibold text-accent-foreground">
              AL
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
              <span className="truncate">{t("shell.userName")}</span>
              <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-xs font-medium">
                <Sparkles className="size-2.5" />
                Pro
              </Badge>
            </p>
            <p className="truncate text-xs text-muted-foreground">{t("shell.userEmail")}</p>
          </div>
        </div>

        <div className="px-1.5 pb-1.5 pt-1">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Monthly runs</span>
            <span className="font-mono text-muted-foreground/80">7.4k / 10k</span>
          </div>
          <Progress value={74} className="h-1.5" />
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push("/settings/profile")}>
            <UserRound className="size-4" />
            {t("common.profile")}
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/settings/security")}>
            <ShieldCheck className="size-4" />
            Security
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/settings/billing")}>
            <CreditCard className="size-4" />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette className="size-4" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  <Sun className="size-4" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="size-4" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <MonitorCog className="size-4" />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserRound className="size-4" />
              Switch account
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {otherAccounts.map((account) => (
                <DropdownMenuItem key={account.email} className="gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="font-mono text-xs">{account.initials}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-4">{account.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{account.email}</span>
                  </span>
                  {account.current ? <span className="ml-auto text-primary">●</span> : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="size-4" />
                Add account
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => setCommandOpen(true)}>
            <Command className="size-4" />
            Command menu
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoy className="size-4" />
            Support
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut className="size-4" />
          {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
