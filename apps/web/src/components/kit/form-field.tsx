import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import type { FieldError } from "react-hook-form";

import { Label } from "@/components/ui/label";

export function FormField({
  id,
  label,
  description,
  error,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: FieldError;
  children: ReactNode;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  // Keep the field composition ergonomic while making the accessibility
  // contract automatic. Non-control siblings (for example a "Forgot
  // password" link) pass through untouched.
  const connectedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const control = child as ReactElement<{
      id?: string;
      "aria-describedby"?: string;
      "aria-invalid"?: boolean | "true" | "false";
    }>;
    if (control.props.id !== id) return child;

    const existingDescription = control.props["aria-describedby"];
    return cloneElement(control, {
      "aria-describedby": [existingDescription, describedBy].filter(Boolean).join(" ") || undefined,
      "aria-invalid": control.props["aria-invalid"] ?? Boolean(error),
    });
  });

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {connectedChildren}
      {description ? (
        <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs leading-5 text-destructive">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
