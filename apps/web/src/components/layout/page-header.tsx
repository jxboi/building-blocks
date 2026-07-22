import type { Route } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Breadcrumb } from "@/lib/navigation/breadcrumbs";

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-enter">
      <div className="mx-auto max-w-6xl px-4 pb-5 pt-7 md:px-8 md:pb-7 md:pt-10">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="size-3" strokeWidth={1.8} aria-hidden="true" /> : null}
                {item.href ? (
                  <Link className="transition-colors hover:text-foreground" href={item.href as Route}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
