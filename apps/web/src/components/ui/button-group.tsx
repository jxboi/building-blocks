import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Joins a row of buttons into one segmented control. The attribute-scoped
 * radius overrides (`[&>[data-slot=button]]`) beat the button's own utilities,
 * so buttons of any size join cleanly. Best with the `outline` or `secondary`
 * button variants.
 */
function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "flex w-fit items-center rounded-md shadow-xs [&>[data-slot=button]]:relative [&>[data-slot=button]]:rounded-none [&>[data-slot=button]]:shadow-none [&>[data-slot=button]:not(:first-child)]:-ml-px [&>[data-slot=button]:first-child]:rounded-l-md [&>[data-slot=button]:last-child]:rounded-r-md [&>[data-slot=button]:hover]:z-10 [&>[data-slot=button]:focus-visible]:z-10",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
