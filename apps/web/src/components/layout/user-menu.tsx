"use client";

import { CreditCard, LogOut, MonitorCog, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            compact
              ? "size-7 rounded-full p-0"
              : "h-auto w-full justify-start gap-2 px-1.5 py-1.5 text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
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
              <span className="block truncate text-xs leading-3.5 text-sidebar-foreground/40">
                {t("shell.userEmail")}
              </span>
            </span>
          ) : null}
          <span className="sr-only">{t("common.openMenu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel>
          <span className="block text-xs font-normal text-muted-foreground">
            {t("common.signedInAs")}
          </span>
          <span className="block truncate">{t("shell.userEmail")}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push("/settings/profile")}>
            <UserRound className="size-4" />
            {t("common.profile")}
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
          <DropdownMenuItem onSelect={() => setTheme("light")}>
            <Sun className="size-4" />
            Light theme
            {theme === "light" ? <span className="ml-auto text-primary">●</span> : null}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setTheme("dark")}>
            <Moon className="size-4" />
            Dark theme
            {theme === "dark" ? <span className="ml-auto text-primary">●</span> : null}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setTheme("system")}>
            <MonitorCog className="size-4" />
            System theme
            {theme === "system" ? <span className="ml-auto text-primary">●</span> : null}
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
