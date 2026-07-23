"use client";

import { Activity, Clock3, Users } from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { ConfirmationDialog } from "@/components/kit/confirmation-dialog";
import { DataTable, type DataColumn } from "@/components/kit/data-table";
import { BarList } from "@/components/kit/dashboard/bar-list";
import { DateRangePicker } from "@/components/kit/dashboard/date-range-picker";
import { StatTile } from "@/components/kit/dashboard/stat-tile";
import { TimeSeriesChart } from "@/components/kit/dashboard/time-series-chart";
import { EmptyState } from "@/components/kit/empty-state";
import { FilterBar } from "@/components/kit/filter-bar";
import { FormField } from "@/components/kit/form-field";
import { Img } from "@/components/kit/img";
import { InlineAlert } from "@/components/kit/inline-alert";
import { PageSkeleton } from "@/components/kit/page-skeleton";
import { StatusBadge, type ShellStatus } from "@/components/kit/status-badge";
import { TableRowActions } from "@/components/kit/table-row-actions";
import { Input } from "@/components/ui/input";
import { KIT_IDS, type KitId } from "@/components/design/catalogue-manifest";

export const KIT_STATE_KINDS = ["default", "loading", "empty", "error", "disabled", "permission"] as const;
export type KitStateKind = (typeof KIT_STATE_KINDS)[number];
export type KitState = { kind: KitStateKind; label: string; node: ReactNode };
export type KitStateCoverage = Record<KitStateKind, "shown" | { notApplicable: string }>;
export type KitEntry = {
  title: string;
  description: string;
  states: readonly KitState[];
  coverage: KitStateCoverage;
};

function coverage(shown: readonly KitStateKind[], notApplicable: string): KitStateCoverage {
  return Object.fromEntries(
    KIT_STATE_KINDS.map((kind) => [kind, shown.includes(kind) ? "shown" : { notApplicable }]),
  ) as KitStateCoverage;
}

type SampleRow = { id: string; name: string; owner: string; status: ShellStatus };
const sampleRows: readonly SampleRow[] = [
  { id: "1", name: "Security review", owner: "Maya Chen", status: "active" },
  { id: "2", name: "Partner onboarding", owner: "Jon Okafor", status: "pending" },
  { id: "3", name: "Q3 budget", owner: "Sam Lee", status: "blocked" },
];
const sampleColumns: readonly DataColumn<SampleRow>[] = [
  { id: "name", header: "Name", mobilePriority: "primary", cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: "owner", header: "Owner", mobilePriority: "secondary", cell: (row) => row.owner },
  { id: "status", header: "Status", mobilePriority: "secondary", cell: (row) => <StatusBadge status={row.status} /> },
];

const filterDefinitions = [
  { id: "status", label: "Status", type: "enum", options: [{ label: "Active", value: "active" }] },
  { id: "owner", label: "Owner", type: "entity" },
  { id: "created", label: "Created", type: "date-range" },
] as const;

const trendData = [
  { label: "Mon", completed: 12, created: 18 },
  { label: "Tue", completed: 19, created: 16 },
  { label: "Wed", completed: 15, created: 21 },
  { label: "Thu", completed: 24, created: 20 },
  { label: "Fri", completed: 22, created: 17 },
];

const breakdown = [
  { label: "Active", value: 128, detail: "128" },
  { label: "Pending", value: 74, detail: "74" },
  { label: "Blocked", value: 19, detail: "19" },
];

// Inline avatar so the <Img> wrapper renders without a network asset. OKLCH
// fills keep it clear of the no-hex-colors lint rule; encoding makes it a valid
// data URI.
const avatarSvg =
  "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>" +
  "<rect width='96' height='96' rx='16' fill='oklch(0.9 0.01 80)'/>" +
  "<circle cx='48' cy='40' r='16' fill='oklch(0.72 0.02 80)'/>" +
  "<rect x='22' y='62' width='52' height='26' rx='13' fill='oklch(0.72 0.02 80)'/>" +
  "</svg>";
const avatarSrc = `data:image/svg+xml,${encodeURIComponent(avatarSvg)}`;

const allStatuses: readonly ShellStatus[] = ["active", "pending", "draft", "blocked", "complete"];

/**
 * One showcase entry per shell kit component. The `Record<KitId, …>` type makes
 * TypeScript require an entry for every id in the manifest, so "listed" and
 * "shown in the catalogue" cannot drift apart.
 */
export const kitCatalogue: Record<KitId, KitEntry> = {
  "status-badge": {
    title: "StatusBadge",
    description: "Maps an API status enum to a label, colour, and icon — shape plus icon, never colour alone.",
    states: [{ kind: "default", label: "Every status", node: <div className="flex flex-wrap gap-2">{allStatuses.map((status) => <StatusBadge key={status} status={status} />)}</div> }],
    coverage: coverage(["default"], "Status badges render a value; collection lifecycle states do not apply."),
  },
  "inline-alert": {
    title: "InlineAlert",
    description: "Contextual messaging that lives in the content flow and never auto-dismisses.",
    states: [
      { kind: "default", label: "Info", node: <InlineAlert title="Useful context" description="Information supports the task without interrupting it." /> },
      { kind: "default", label: "Success", node: <InlineAlert title="Everything is healthy" description="Confirms a durable state change." severity="success" /> },
      { kind: "default", label: "Warning", node: <InlineAlert title="Review required" description="Stays until the condition is resolved." severity="warning" /> },
      { kind: "error", label: "Error", node: <InlineAlert title="Unable to save" description="Tells the person what happened and what to do next." severity="error" /> },
    ],
    coverage: coverage(["default", "error"], "Alerts communicate a supplied condition; loading, empty, disabled, and permission states are caller content."),
  },
  "empty-state": {
    title: "EmptyState",
    description: "Three distinct variants — no data yet, no results, no permission — never conflated.",
    states: [
      { kind: "empty", label: "No data yet", node: <EmptyState title="No data yet" description="Create the first item to begin this workflow." actionLabel="Create item" /> },
      { kind: "empty", label: "No results", node: <EmptyState variant="results" title="No matching results" description="Try removing a filter or changing the search terms." actionLabel="Clear filters" /> },
      { kind: "permission", label: "No permission", node: <EmptyState variant="permission" title="Permission required" description="An owner can grant access through a registered role." actionLabel="Request access" /> },
    ],
    coverage: coverage(["empty", "permission"], "EmptyState is itself a terminal collection state; default, loading, error, and disabled are separate compositions."),
  },
  "form-field": {
    title: "FormField",
    description: "Labelled field wrapper wiring description and error ids for assistive tech.",
    states: [
      { kind: "default", label: "Default", node: <FormField id="kit-name" label="Workspace name" description="Shown across the product."><Input id="kit-name" placeholder="Acme" /></FormField> },
      { kind: "error", label: "With error", node: <FormField id="kit-slug" label="Workspace slug" error={{ type: "validate", message: "Use lowercase letters and dashes." }}><Input id="kit-slug" defaultValue="Bad Slug" /></FormField> },
      { kind: "disabled", label: "Disabled", node: <FormField id="kit-locked" label="Workspace name" description="Managed by your organisation."><Input id="kit-locked" disabled defaultValue="Acme" /></FormField> },
    ],
    coverage: coverage(["default", "error", "disabled"], "A field has no standalone loading, empty, or permission state."),
  },
  "data-table": {
    title: "DataTable",
    description: "Responsive table that collapses to row-cards on mobile via per-column priority hints.",
    states: [
      { kind: "default", label: "Populated", node: <DataTable rows={sampleRows} columns={sampleColumns} rowActions={[{ label: "View details" }, { label: "Archive" }]} /> },
      { kind: "loading", label: "Loading", node: <PageSkeleton /> },
      { kind: "empty", label: "Empty", node: <EmptyState title="No data yet" description="Create the first item to populate this table." actionLabel="Create item" /> },
      { kind: "error", label: "Error", node: <InlineAlert severity="error" title="Unable to load items" description="Try again, or use the correlation ID when contacting support." /> },
      { kind: "permission", label: "No permission", node: <EmptyState variant="permission" title="Permission required" description="Ask a workspace owner for access." actionLabel="Request access" /> },
    ],
    coverage: coverage(["default", "loading", "empty", "error", "permission"], "Rows are actions, not form controls; a disabled table state does not apply."),
  },
  "table-row-actions": {
    title: "TableRowActions",
    description: "The per-row overflow menu; the same action list backs the right-click context menu.",
    states: [{ kind: "default", label: "Menu", node: <div className="flex justify-start"><TableRowActions labels={["View details", "Duplicate", "Archive"]} /></div> }],
    coverage: coverage(["default"], "Row actions render only for an available row; collection lifecycle states do not apply."),
  },
  "filter-bar": {
    title: "FilterBar",
    description: "Declarative list filtering that serialises to the URL — shareable, SSR-consistent views.",
    states: [
      { kind: "default", label: "Default", node: <FilterBar definitions={filterDefinitions} /> },
      { kind: "disabled", label: "Disabled", node: <FilterBar definitions={filterDefinitions} disabled /> },
    ],
    coverage: coverage(["default", "disabled"], "The filter bar remains structurally present while its owning collection renders lifecycle states."),
  },
  "confirmation-dialog": {
    title: "ConfirmationDialog",
    description: "Shared destructive confirmation; the irreversible tier requires typing the entity name.",
    states: [{ kind: "default", label: "Name-typing", node: <ConfirmationDialog title="Delete Product?" description="This action cannot be undone after the grace period." triggerLabel="Delete workspace" confirmationText="Product" /> }],
    coverage: coverage(["default"], "Confirmation dialogs are invoked only for an available action; collection lifecycle states do not apply."),
  },
  img: {
    title: "Img",
    description: "The only sanctioned image wrapper — enforces dimensions, lazy loading, and private variants.",
    states: [{ kind: "default", label: "Avatar", node: <Img src={avatarSrc} alt="Member avatar" width={96} height={96} className="rounded-lg border" /> }],
    coverage: coverage(["default"], "Image loading and failure behavior is owned by the browser and file-status consumer."),
  },
  "page-skeleton": {
    title: "PageSkeleton",
    description: "Route-level loading shape that matches the final layout — no spinner-only pages.",
    states: [{ kind: "loading", label: "Loading", node: <div className="overflow-hidden rounded-lg border bg-card"><PageSkeleton /></div> }],
    coverage: coverage(["loading"], "PageSkeleton represents loading only; other states use their dedicated kit components."),
  },
  "dashboard/stat-tile": {
    title: "StatTile",
    description: "Headline metric with a trend direction; part of the developer-assembled dashboard kit.",
    states: [
      { kind: "default", label: "Up", node: <div className="max-w-56 rounded-lg border"><StatTile label="Active members" value="1,284" detail="+12% vs last month" trend="up" icon={Users} /></div> },
      { kind: "default", label: "Down", node: <div className="max-w-56 rounded-lg border"><StatTile label="Open incidents" value="3" detail="-40% vs last week" trend="down" icon={Activity} /></div> },
      { kind: "default", label: "Neutral", node: <div className="max-w-56 rounded-lg border"><StatTile label="Pending invites" value="17" detail="No change" trend="neutral" icon={Clock3} /></div> },
    ],
    coverage: coverage(["default"], "Dashboard-level loading, empty, error, and permission states wrap the assembled widget grid."),
  },
  "dashboard/time-series-chart": {
    title: "TimeSeriesChart",
    description: "Recharts line chart themed by the same CSS variables, so light and dark come for free.",
    states: [{ kind: "default", label: "Trend", node: <div className="rounded-lg border p-4"><TimeSeriesChart data={trendData} /></div> }],
    coverage: coverage(["default"], "Dashboard-level lifecycle states wrap the assembled widget grid."),
  },
  "dashboard/bar-list": {
    title: "BarList",
    description: "Ranked breakdown with proportional bars for compact categorical comparisons.",
    states: [{ kind: "default", label: "Breakdown", node: <div className="max-w-md rounded-lg border p-4"><BarList items={breakdown} /></div> }],
    coverage: coverage(["default"], "Dashboard-level lifecycle states wrap the assembled widget grid."),
  },
  "dashboard/date-range-picker": {
    title: "DateRangePicker",
    description: "Preset-driven range control; presets stay correct over time and respect the org timezone.",
    states: [{ kind: "default", label: "Presets", node: <DateRangePicker /> }],
    coverage: coverage(["default"], "The range picker is omitted when unavailable; collection lifecycle states do not apply."),
  },
};

/** Registry-driven kit reference: every component, shown in its key states. */
export function KitCatalogueTab() {
  return (
    <div className="grid gap-10">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Every shell kit component, imported from source and shown in its key states. The list is exhaustive by test — a new
        component under <code className="font-mono text-xs">components/kit</code> fails CI until it appears here.
      </p>
      <Suspense>
        {KIT_IDS.map((id) => {
          const entry = kitCatalogue[id];
          const single = entry.states.length === 1;
          return (
            <section key={id} className="grid min-w-0 gap-4 border-t pt-8 first:border-0 first:pt-0">
              <div className="grid gap-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-xl font-semibold">{entry.title}</h2>
                  <code className="font-mono text-xs text-muted-foreground">kit/{id}</code>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">{entry.description}</p>
              </div>
              <div className={single ? "grid gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
                {entry.states.map((state) => (
                  <div key={state.label} className="grid min-w-0 gap-2">
                    {single ? null : (
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{state.label}</p>
                    )}
                    <div className="flex min-h-24 min-w-0 flex-col justify-center gap-3 overflow-hidden rounded-lg bg-muted/20 p-5">{state.node}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </Suspense>
    </div>
  );
}
