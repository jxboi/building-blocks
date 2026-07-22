import { cn } from "@/lib/utils";

export function BarList({
  items,
}: {
  items: readonly { label: string; value: number; detail: string }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="grid gap-3.5">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1.5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="font-mono text-xs text-muted-foreground">{item.detail}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full bg-primary/75")}
              style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
