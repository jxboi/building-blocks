import { AlertTriangle, Bell, Boxes, Component, Database, Palette, Plus, Search, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";

import { ContrastMatrix } from "@/components/design/contrast-matrix";
import { ControlsCatalogue } from "@/components/design/controls-catalogue";
import { KitCatalogueTab } from "@/components/design/kit-catalogue";
import { MessagingCatalogue } from "@/components/design/messaging-catalogue";
import { entityIcons } from "@/lib/icons/entity-icons";
import { ConfirmationDialog } from "@/components/kit/confirmation-dialog";
import { DataTable, type DataColumn } from "@/components/kit/data-table";
import { EmptyState } from "@/components/kit/empty-state";
import { InlineAlert } from "@/components/kit/inline-alert";
import { PageSkeleton } from "@/components/kit/page-skeleton";
import { StatusBadge, type ShellStatus } from "@/components/kit/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readContrastAudit } from "@/lib/design/contrast-audit";
import { glossary } from "@/lib/design/glossary";
import { SPACING_STEPS } from "@/lib/design/scale";
import { FOUNDATION_TOKEN_GROUPS, SEMANTIC_COLOUR_TOKENS, TYPE_SCALE } from "@/lib/design/tokens";

// The documented spacing subset — derived from the single-source SPACING_STEPS
// the lint rule enforces, so the specimen can never drift from the rule.
const spacingSubset = SPACING_STEPS.filter((step) => step > 0).map(
  (step) => [String(step), `${step * 0.25}rem`] as const,
);

type CatalogueRow = { id: string; name: string; owner: string; status: ShellStatus };
const columns: readonly DataColumn<CatalogueRow>[] = [
  { id: "name", header: "Name", mobilePriority: "primary", cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: "owner", header: "Owner", mobilePriority: "secondary", cell: (row) => row.owner },
  { id: "status", header: "Status", mobilePriority: "secondary", cell: (row) => <StatusBadge status={row.status} /> },
];
const rows: readonly CatalogueRow[] = [
  { id: "1", name: "Security review", owner: "Maya Chen", status: "pending" },
  { id: "2", name: "Partner onboarding", owner: "Jon Okafor", status: "active" },
  { id: "3", name: "Q3 budget", owner: "Sam Lee", status: "blocked" },
];

function TokenGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {SEMANTIC_COLOUR_TOKENS.map(([label, token]) => (
        <div key={label} className="group overflow-hidden rounded-lg border bg-card transition-colors duration-(--duration-slow) hover:border-foreground/20">
          <div className="h-16" style={{ backgroundColor: `var(${token})` }} />
          <div className="grid gap-0.5 border-t px-3 py-2">
            <p className="text-xs font-medium">{label}</p>
            <p className="font-mono text-xs text-muted-foreground">{token}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FoundationTokenGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {FOUNDATION_TOKEN_GROUPS.map((group) => (
        <Card key={group.label}>
          <CardHeader><CardTitle>{group.label}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {group.tokens.map(([label, token]) => (
              <div key={token} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{token}</p>
                </div>
                {group.label === "Radius" ? (
                  <span className="size-10 border bg-muted" style={{ borderRadius: `var(${token})` }} />
                ) : group.label === "Elevation" ? (
                  <span className="size-10 rounded-md bg-card" style={{ boxShadow: `var(${token})` }} />
                ) : group.label === "Icon size" ? (
                  <Sparkles aria-hidden="true" style={{ width: `var(${token})`, height: `var(${token})` }} />
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">var({token})</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ThemeSpecimen({ mode }: { mode: "light" | "dark" }) {
  return (
    <div className={`${mode === "light" ? "catalogue-light" : "catalogue-dark"} rounded-lg border bg-background p-4 text-foreground`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">{mode} theme</p>
          <h3 className="mt-1 font-semibold">Semantic roles</h3>
        </div>
        <Badge variant="secondary">AA checked</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace health</CardTitle>
          <CardDescription>Components consume semantic tokens only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Progress value={78} />
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="active" />
            <StatusBadge status="pending" />
            <StatusBadge status="blocked" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DesignCatalogue() {
  const contrast = readContrastAudit();
  return (
    <main className="min-h-dvh bg-background">
      <div className="border-b bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <Badge variant="outline" className="mb-5"><Sparkles className="size-3" />Living catalogue</Badge>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Design system</h1>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                Primitive tokens become semantic roles. The catalogue imports the same components product routes use and renders their key states.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Tabs defaultValue="tokens">
          <div className="mb-6 overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger value="tokens"><Palette className="size-4" />Tokens</TabsTrigger>
            <TabsTrigger value="components"><Component className="size-4" />Components</TabsTrigger>
            <TabsTrigger value="controls"><SlidersHorizontal className="size-4" />Controls</TabsTrigger>
            <TabsTrigger value="patterns"><Database className="size-4" />Patterns</TabsTrigger>
            <TabsTrigger value="kit"><Boxes className="size-4" />Kit</TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="tokens" className="grid gap-8">
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Semantic colour tokens</h2><p className="mt-1 text-sm text-muted-foreground">Raw palette values remain confined to the primitive layer.</p></div>
              <TokenGrid />
            </section>
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Foundation tokens</h2><p className="mt-1 text-sm text-muted-foreground">The complete radius, elevation, motion, and icon-size contracts.</p></div>
              <FoundationTokenGrid />
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Both themes</h2>
              <div className="grid gap-4 lg:grid-cols-2"><ThemeSpecimen mode="light" /><ThemeSpecimen mode="dark" /></div>
            </section>
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Contrast checks</h2><p className="mt-1 text-sm text-muted-foreground">WCAG ratios computed from the tokens themselves — a change that drops a pair below AA fails the contrast test in CI.</p></div>
              <div className="grid gap-4 lg:grid-cols-2"><ContrastMatrix mode="light" results={contrast.light} /><ContrastMatrix mode="dark" results={contrast.dark} /></div>
            </section>
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Closed type scale</h2><p className="mt-1 text-sm text-muted-foreground">Five sizes. Anything off the scale (text-lg, text-3xl and larger) fails lint in product code.</p></div>
              <Card><CardContent className="grid gap-5 py-6">
                {TYPE_SCALE.map(({ className, name, note }) => (
                  <div key={className} className="flex flex-col gap-1 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                    <p className={`${className} font-semibold tracking-tight`}>{name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{className} · {note}</p>
                  </div>
                ))}
              </CardContent></Card>
            </section>
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Spacing subset</h2><p className="mt-1 text-sm text-muted-foreground">Components draw from this subset of Tailwind&rsquo;s scale; arbitrary pixel values fail lint.</p></div>
              <Card><CardContent className="flex flex-wrap items-end gap-4 py-6">
                {spacingSubset.map(([step, rem]) => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className="rounded-sm bg-primary" style={{ width: `calc(var(--spacing) * ${step})`, height: `calc(var(--spacing) * ${step})` }} />
                    <p className="font-mono text-xs text-muted-foreground">{step}</p>
                    <p className="font-mono text-xs text-muted-foreground/70">{rem}</p>
                  </div>
                ))}
              </CardContent></Card>
            </section>
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Terminology</h2><p className="mt-1 text-sm text-muted-foreground">One canonical name per concept — naming is part of the system. Use the term on the left; avoid the alternatives.</p></div>
              <Card><CardContent className="grid gap-4 py-6">
                {glossary.map((entry) => (
                  <div key={entry.term} className="grid gap-1 border-b pb-4 last:border-0 last:pb-0 sm:flex sm:gap-6">
                    <p className="font-medium sm:w-40 sm:shrink-0">{entry.term}</p>
                    <div className="grid gap-1">
                      <p className="text-sm text-muted-foreground">{entry.meaning}</p>
                      <p className="text-xs text-muted-foreground">Avoid: {entry.avoid.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </CardContent></Card>
            </section>
          </TabsContent>

          <TabsContent value="components" className="grid gap-8">
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Actions</h2>
              <Card><CardContent className="flex flex-wrap items-center gap-3 py-6">
                <Button><Plus className="size-4" />Create</Button>
                <Button variant="secondary"><Settings2 className="size-4" />Configure</Button>
                <Button variant="outline"><Search className="size-4" />Search</Button>
                <Button variant="ghost"><Bell className="size-4" />Notify</Button>
                <Button variant="destructive"><AlertTriangle className="size-4" />Remove</Button>
                <Button disabled>Disabled</Button>
              </CardContent></Card>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                <InlineAlert title="Everything is healthy" description="The success surface confirms a durable state change." severity="success" />
                <InlineAlert title="Review required" description="Warnings stay in flow until the condition is resolved." severity="warning" />
                <InlineAlert title="Useful context" description="Information supports the task without interrupting it." />
                <InlineAlert title="Unable to save" description="Error copy tells the person what happened and what to do next." severity="error" />
              </div>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Form states</h2>
              <Card><CardContent className="grid gap-5 py-6 sm:grid-cols-2">
                <div className="grid gap-2"><Label htmlFor="catalogue-default">Default input</Label><Input id="catalogue-default" placeholder="Workspace name" /></div>
                <div className="grid gap-2"><Label htmlFor="catalogue-invalid">Invalid input</Label><Input id="catalogue-invalid" aria-invalid="true" defaultValue="bad value" /><p className="text-xs text-destructive">Use a valid workspace slug.</p></div>
              </CardContent></Card>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Loading shape</h2>
              <Card><CardContent className="grid gap-4 py-6"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
            </section>
          </TabsContent>

          <TabsContent value="controls">
            <ControlsCatalogue />
          </TabsContent>

          <TabsContent value="patterns" className="grid gap-8">
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Responsive data table</h2>
              <DataTable rows={rows} columns={columns} rowActions={[{ label: "View details" }, { label: "Archive" }]} />
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Distinct empty states</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                <EmptyState title="No data yet" description="Create the first item to begin this workflow." actionLabel="Create item" />
                <EmptyState variant="results" title="No matching results" description="Try removing a filter or changing the search terms." actionLabel="Clear filters" />
                <EmptyState variant="permission" title="Permission required" description="An owner can grant access through a registered role." actionLabel="Request access" />
              </div>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Destructive confirmation</h2>
              <Card><CardHeader><CardTitle>Delete workspace</CardTitle><CardDescription>Irreversible actions require the entity name.</CardDescription></CardHeader><CardFooter><ConfirmationDialog title="Delete Product?" description="This action cannot be undone after the grace period." triggerLabel="Delete workspace" confirmationText="Product" /></CardFooter></Card>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-semibold">Mobile-width route skeleton</h2>
              <div className="max-w-sm overflow-hidden rounded-lg border bg-card"><PageSkeleton /></div>
            </section>
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Messaging surfaces</h2><p className="mt-1 text-sm text-muted-foreground">The banner slot and toasts — two of the five surfaces in the messaging hierarchy.</p></div>
              <MessagingCatalogue />
            </section>
            <section className="grid gap-4">
              <div><h2 className="text-xl font-semibold">Entity icons</h2><p className="mt-1 text-sm text-muted-foreground">One canonical icon per entity, resolved the same way in nav, search, notifications, and breadcrumbs.</p></div>
              <Card><CardContent className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(entityIcons).map(([kind, Icon]) => (
                  <div key={kind} className="flex items-center gap-2.5 rounded-md border bg-card/40 px-3 py-2">
                    <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
                    <span className="truncate text-sm">{kind}</span>
                  </div>
                ))}
              </CardContent></Card>
            </section>
          </TabsContent>

          <TabsContent value="kit">
            <KitCatalogueTab />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 border-t pt-6">
          <h2 className="text-sm font-semibold">Review checklist</h2>
          <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            <li>Right messaging surface: tooltip · inline alert · toast · banner · modal.</li>
            <li>Disabled with a tooltip why when the user could gain the ability; hidden when they never can.</li>
            <li>Icon-only controls carry a tooltip and accessible name; menu items are icon + label.</li>
            <li>Skeletons match the final layout; collections ship empty, no-results, and no-permission states.</li>
            <li>Sentence case; canonical terms from the glossary; UI strings come from i18n keys.</li>
            <li>Semantic tokens only; five type sizes; spacing from the documented subset.</li>
          </ul>
          <p className="mt-4 font-mono text-xs text-muted-foreground">Full conventions: apps/web/CONTRIBUTING.md</p>
        </footer>
      </div>
    </main>
  );
}
