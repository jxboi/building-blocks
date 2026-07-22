import { Building2, Plus, ShieldCheck, Users } from "lucide-react";

import { DataTable, type DataColumn } from "@/components/kit/data-table";
import { StatTile } from "@/components/kit/dashboard/stat-tile";
import { FilterBar, type FilterDefinition } from "@/components/kit/filter-bar";
import { StatusBadge, type ShellStatus } from "@/components/kit/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { AdminSection } from "@/lib/navigation/routes";

type AdminRow = { id: string; name: string; type: string; status: ShellStatus; updated: string };

const rows: readonly AdminRow[] = [
  { id: "usr_01J4M8", name: "Ada Lovelace", type: "Platform admin", status: "active", updated: "2 min ago" },
  { id: "org_01J4N2", name: "Acme Studio", type: "Organisation", status: "active", updated: "18 min ago" },
  { id: "job_01J4P7", name: "Daily metrics rollup", type: "Recurring job", status: "pending", updated: "41 min ago" },
];

const columns: readonly DataColumn<AdminRow>[] = [
  { id: "name", header: "Name", mobilePriority: "primary", cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: "id", header: "ID", mobilePriority: "hidden", cell: (row) => <code className="font-mono text-xs text-muted-foreground">{row.id}</code> },
  { id: "type", header: "Type", mobilePriority: "secondary", cell: (row) => row.type },
  { id: "status", header: "Status", mobilePriority: "secondary", cell: (row) => <StatusBadge status={row.status} /> },
  { id: "updated", header: "Updated", mobilePriority: "hidden", cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.updated}</span> },
];

const filters: readonly FilterDefinition[] = [
  { id: "status", label: "Status", type: "enum", options: [{ label: "Active", value: "active" }] },
  { id: "type", label: "Type", type: "enum", options: [{ label: "User", value: "user" }] },
] as const;

export function AdminView({ section }: { section?: AdminSection }) {
  const title = section ? section.replaceAll("-", " ").replace(/^./, (value) => value.toUpperCase()) : "Platform overview";
  return (
    <>
      <PageHeader
        eyebrow="Platform operations"
        title={title}
        description="A desktop-optimised operator surface built from the same registry, permission, table, and messaging patterns."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, ...(section ? [{ label: title }] : [])]}
        actions={<Button><Plus className="size-4" />Create</Button>}
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Active users" value="12,482" detail="4.8% this month" icon={Users} />
          <StatTile label="Organisations" value="846" detail="21 new this month" icon={Building2} />
          <StatTile label="Elevated sessions" value="2" detail="Both expire within 1 hour" icon={ShieldCheck} trend="neutral" />
        </section>
        <FilterBar definitions={filters} />
        <DataTable rows={rows} columns={columns} rowActions={[{ label: "View details" }, { label: "Open audit trail" }]} />
      </div>
    </>
  );
}
