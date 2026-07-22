import { Check, TriangleAlert } from "lucide-react";

import type { ContrastResult } from "@/lib/design/contrast";

function Row({ result }: { result: ContrastResult }) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold"
        style={{ backgroundColor: `var(${result.bg})`, color: `var(${result.fg})` }}
        aria-hidden="true"
      >
        Aa
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{result.label}</span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{result.ratio.toFixed(1)}:1</span>
      <span
        className={`flex items-center gap-1 text-xs font-medium ${result.passes ? "text-success" : "text-destructive"}`}
        title={`Minimum ${result.min}:1`}
      >
        {result.passes ? (
          <Check className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <TriangleAlert className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        )}
        <span>{result.passes ? "AA" : "Fails"}</span>
      </span>
    </div>
  );
}

/**
 * Renders live WCAG contrast ratios for the guaranteed semantic pairs, scoped
 * to one theme so the swatches show that theme's actual colours. Ratios come
 * from the same parser the contrast unit test gates on.
 */
export function ContrastMatrix({ mode, results }: { mode: "light" | "dark"; results: readonly ContrastResult[] }) {
  const failing = results.filter((r) => !r.passes).length;
  return (
    <div className={`${mode === "light" ? "catalogue-light" : "catalogue-dark"} rounded-lg border bg-background p-4 text-foreground`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">{mode} theme</p>
        <span className={`text-xs font-medium ${failing ? "text-destructive" : "text-muted-foreground"}`}>
          {results.length === 0 ? "No data" : failing ? `${failing} failing` : "All pairs pass"}
        </span>
      </div>
      <div className="grid gap-2">
        {results.map((result) => (
          <Row key={`${result.fg}-${result.bg}`} result={result} />
        ))}
      </div>
    </div>
  );
}
