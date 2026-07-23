"use client";

import type { Route } from "next";
import { Download, Filter, Save, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type FilterDefinition = {
  id: string;
  label: string;
  type: "enum" | "entity" | "date-range" | "boolean" | "text";
  options?: readonly { label: string; value: string }[];
};

export function FilterBar({ definitions, disabled = false }: { definitions: readonly FilterDefinition[]; disabled?: boolean }) {
  const router = useRouter();
  const t = useTranslations("common");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = definitions.filter((definition) => searchParams.has(definition.id));

  function setFilter(id: string, value?: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(id, value);
    else next.delete(id);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}` as Route, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled}>
            <Filter className="size-4" />
            {t("addFilter")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {definitions.map((definition) => (
            <DropdownMenuItem
              key={definition.id}
              onSelect={() => setFilter(definition.id, definition.options?.[0]?.value ?? "true")}
            >
              {definition.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {active.map((definition) => (
        <Badge key={definition.id} variant="secondary" className="h-8 gap-2 rounded-md px-2.5">
          <span className="text-muted-foreground">{definition.label}</span>
          <span>{searchParams.get(definition.id)}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="-mr-1"
            onClick={() => setFilter(definition.id)}
            disabled={disabled}
          >
            <X className="size-3" />
            <span className="sr-only">{t("removeFilter", { label: definition.label })}</span>
          </Button>
        </Badge>
      ))}
      <div className="ml-auto flex items-center gap-1">
        {active.length ? (
          <Button variant="ghost" size="sm" disabled={disabled} onClick={() => router.replace(pathname as Route)}>
            {t("clearAll")}
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" aria-label={t("saveView")} disabled={disabled}>
          <Save className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("exportView")} disabled={disabled}>
          <Download className="size-4" />
        </Button>
      </div>
    </div>
  );
}
