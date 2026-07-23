import type { LucideIcon } from "lucide-react";
import { Inbox, LockKeyhole, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const variantIcons = {
  empty: Inbox,
  results: SearchX,
  permission: LockKeyhole,
} satisfies Record<string, LucideIcon>;

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  variant = "empty",
  icon: Icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: keyof typeof variantIcons;
  icon?: LucideIcon;
}) {
  const StateIcon = Icon ?? variantIcons[variant];

  return (
    <Card className="border-dashed bg-card/40 shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="mb-5 flex size-12 items-center justify-center rounded-lg border bg-background">
          <StateIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {actionLabel ? (
          <Button className="mt-6" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
