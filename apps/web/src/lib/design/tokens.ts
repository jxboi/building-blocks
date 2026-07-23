/** Shared metadata for the enforced token contract and the living catalogue. */
export const TYPE_SCALE = [
  { className: "text-2xl", name: "Title", note: "24px — page titles, one per screen" },
  { className: "text-xl", name: "Heading", note: "20px — section and card headings" },
  { className: "text-base", name: "Body", note: "16px — primary reading copy and inputs" },
  { className: "text-sm", name: "Label", note: "14px — controls, table cells, secondary text" },
  { className: "text-xs", name: "Caption", note: "12px — metadata, timestamps, eyebrows" },
] as const;

export const SEMANTIC_COLOUR_TOKENS = [
  ["Background", "--background"], ["Foreground", "--foreground"],
  ["Card", "--card"], ["Card foreground", "--card-foreground"],
  ["Popover", "--popover"], ["Popover foreground", "--popover-foreground"],
  ["Primary", "--primary"], ["Primary foreground", "--primary-foreground"],
  ["Secondary", "--secondary"], ["Secondary foreground", "--secondary-foreground"],
  ["Muted", "--muted"], ["Muted foreground", "--muted-foreground"],
  ["Accent", "--accent"], ["Accent foreground", "--accent-foreground"],
  ["Destructive", "--destructive"], ["Border", "--border"], ["Input", "--input"], ["Ring", "--ring"],
  ["Success", "--success"], ["Warning", "--warning"], ["Info", "--info"],
  ["Chart 1", "--chart-1"], ["Chart 2", "--chart-2"], ["Chart 3", "--chart-3"],
  ["Chart 4", "--chart-4"], ["Chart 5", "--chart-5"],
  ["Sidebar", "--sidebar"], ["Sidebar foreground", "--sidebar-foreground"],
  ["Sidebar primary", "--sidebar-primary"], ["Sidebar primary foreground", "--sidebar-primary-foreground"],
  ["Sidebar accent", "--sidebar-accent"], ["Sidebar accent foreground", "--sidebar-accent-foreground"],
  ["Sidebar border", "--sidebar-border"], ["Sidebar ring", "--sidebar-ring"],
] as const;

export const FOUNDATION_TOKEN_GROUPS = [
  {
    label: "Radius",
    tokens: [
      ["Control", "--radius-control"], ["Card", "--radius-card"], ["Panel", "--radius-panel"],
    ],
  },
  {
    label: "Elevation",
    tokens: [
      ["Card", "--elevation-1"], ["Overlay", "--elevation-2"], ["Modal", "--elevation-3"],
    ],
  },
  {
    label: "Motion",
    tokens: [
      ["Fast", "--duration-fast"], ["Slow", "--duration-slow"], ["Fluid easing", "--ease-fluid"],
    ],
  },
  {
    label: "Icon size",
    tokens: [
      ["Inline / menu", "--icon-inline"], ["Control / nav", "--icon-control"], ["Page", "--icon-page"],
    ],
  },
] as const;

export const FOUNDATION_TOKEN_NAMES = FOUNDATION_TOKEN_GROUPS.flatMap((group) => group.tokens.map(([, name]) => name));
