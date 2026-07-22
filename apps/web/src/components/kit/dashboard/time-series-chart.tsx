"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useEffect, useRef, useState } from "react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  completed: { label: "Completed", color: "var(--chart-1)" },
  created: { label: "Created", color: "var(--chart-2)" },
} satisfies ChartConfig;

const chartMargin = { left: 0, right: 8, top: 12, bottom: 0 } as const;
const axisTick = { fontSize: 11 } as const;
const activeDot = { r: 3 } as const;

export function TimeSeriesChart({
  data,
}: {
  data: readonly { label: string; completed: number; created: number }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(700);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(element.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setChartWidth((currentWidth) =>
          currentWidth === nextWidth ? currentWidth : nextWidth,
        );
      }
    };

    updateWidth();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className="h-64 w-full overflow-hidden"
    >
      <LineChart
        data={data}
        accessibilityLayer
        height={256}
        margin={chartMargin}
        width={chartWidth}
      >
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="2 4"
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          tick={axisTick}
        />
        <YAxis axisLine={false} tickLine={false} width={40} tick={axisTick} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="var(--chart-1)"
          strokeWidth={2.25}
          dot={false}
          activeDot={activeDot}
        />
        <Line
          type="monotone"
          dataKey="created"
          stroke="var(--chart-2)"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          dot={false}
          activeDot={activeDot}
        />
      </LineChart>
    </ChartContainer>
  );
}
