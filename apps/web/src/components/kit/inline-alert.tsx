import { AlertCircle, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const alertConfig = {
  info: { icon: Info, className: "border-info/25 bg-info/10 text-info" },
  success: { icon: CircleCheck, className: "border-success/25 bg-success/10 text-success" },
  warning: { icon: TriangleAlert, className: "border-warning/25 bg-warning/10 text-warning" },
  error: { icon: AlertCircle, className: "border-destructive/25 bg-destructive/10 text-destructive" },
} as const;

export function InlineAlert({
  title,
  description,
  severity = "info",
}: {
  title: string;
  description: string;
  severity?: keyof typeof alertConfig;
}) {
  const config = alertConfig[severity];
  return (
    <Alert className={cn(config.className)}>
      <config.icon className="size-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-current">{description}</AlertDescription>
    </Alert>
  );
}
