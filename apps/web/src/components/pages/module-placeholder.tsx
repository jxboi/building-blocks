import type { Route } from "next";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

import { EmptyState } from "@/components/kit/empty-state";
import { FilterBar, type FilterDefinition } from "@/components/kit/filter-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

const filters: readonly FilterDefinition[] = [
  { id: "status", label: "Status", type: "enum", options: [{ label: "Active", value: "active" }] },
  { id: "owner", label: "Owner", type: "entity" },
  { id: "window", label: "Date window", type: "date-range" },
] as const;

export function ModulePlaceholder({
  title,
  description,
  eyebrow,
  breadcrumbs,
}: {
  title: string;
  description: string;
  eyebrow: string;
  breadcrumbs: { label: string; href?: string }[];
}) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={<Button><Plus className="size-4" />Create</Button>}
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:px-8 md:py-8">
        <FilterBar definitions={filters} />
        <EmptyState
          icon={FolderKanban}
          title="Route ready for registration"
          description="The shell owns this page scaffold; the feature module can now register navigation, permissions, help, filters, and its product surface without editing the sidebar."
          actionLabel="Open design catalogue"
        />
        <Button asChild variant="link" className="justify-self-center">
          <Link href={"/design" as Route}>Review component states</Link>
        </Button>
      </div>
    </>
  );
}
