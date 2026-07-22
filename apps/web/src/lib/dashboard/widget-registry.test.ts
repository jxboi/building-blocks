import { describe, expect, it } from "vitest";

import { widgetRegistry } from "@/lib/dashboard/widget-registry";

describe("dashboard widget registry", () => {
  it("ships the three generic composition widgets", () => {
    expect(widgetRegistry.map((widget) => widget.id)).toEqual(["saved-view-count", "saved-view-list", "metric-trend"]);
  });

  it("validates widget parameters at the registration boundary", () => {
    const countWidget = widgetRegistry[0];
    expect(countWidget.params.safeParse({ viewId: "view-1", warningAt: 5 }).success).toBe(true);
    expect(countWidget.params.safeParse({ warningAt: "five" }).success).toBe(false);
  });
});
