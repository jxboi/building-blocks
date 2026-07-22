/**
 * The canonical list of shell kit components (tier 2). Every file under
 * `components/kit` must appear here, and the `/design` kit catalogue renders
 * one entry per id (enforced by the `Record<KitId, …>` type in
 * `kit-catalogue.tsx`). A new kit component therefore fails the exhaustiveness
 * test until it is both listed here and showcased — the catalogue stays true as
 * the kit grows. Ids are the file path under `components/kit`, without `.tsx`.
 */
export const KIT_IDS = [
  "confirmation-dialog",
  "data-table",
  "empty-state",
  "filter-bar",
  "form-field",
  "img",
  "inline-alert",
  "page-skeleton",
  "status-badge",
  "table-row-actions",
  "dashboard/bar-list",
  "dashboard/date-range-picker",
  "dashboard/stat-tile",
  "dashboard/time-series-chart",
] as const;

export type KitId = (typeof KIT_IDS)[number];
