import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Joins a row of controls into one segmented cluster. Targets every direct
 * child carrying a `data-slot` — so plain buttons, split-button dropdown
 * triggers (`data-slot="dropdown-menu-trigger"`), and inputs all join cleanly —
 * and the attribute-scoped radius overrides beat each child's own utilities.
 * Best with the `outline` or `secondary` variants (consistent borders form the
 * dividers). Overlapping borders via `-ml-px` collapse to a single 1px divider.
 */
function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "flex w-fit items-center rounded-md [&>[data-slot]]:relative [&>[data-slot]]:rounded-none [&>[data-slot]]:shadow-none [&>[data-slot]:not(:first-child)]:-ml-px [&>[data-slot]:first-child]:rounded-l-md [&>[data-slot]:last-child]:rounded-r-md [&>[data-slot]:hover]:z-10 [&>[data-slot]:focus-visible]:z-10",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
