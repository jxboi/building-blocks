import { z } from "zod";

export type WidgetSize = "s" | "m" | "l";

export type WidgetDefinition<Schema extends z.ZodType = z.ZodType> = {
  id: string;
  label: string;
  description: string;
  sizes: readonly WidgetSize[];
  params: Schema;
};

export const widgetRegistry = [
  {
    id: "saved-view-count",
    label: "Saved-view count",
    description: "A count and deep link for any saved view.",
    sizes: ["s", "m"],
    params: z.object({ viewId: z.string(), warningAt: z.number().optional() }),
  },
  {
    id: "saved-view-list",
    label: "Saved-view list",
    description: "The top rows from a permission-aware saved view.",
    sizes: ["m", "l"],
    params: z.object({ viewId: z.string(), limit: z.number().min(1).max(20) }),
  },
  {
    id: "metric-trend",
    label: "Metric trend",
    description: "A registered daily metric rendered as a trend.",
    sizes: ["s", "m", "l"],
    params: z.object({ metricKey: z.string(), period: z.enum(["7d", "30d", "90d"]) }),
  },
] as const satisfies readonly WidgetDefinition[];

export function registerWidget<Schema extends z.ZodType>(definition: WidgetDefinition<Schema>) {
  return definition;
}
