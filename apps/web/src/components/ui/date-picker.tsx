"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function DatePicker({
  value,
  onChange,
  placeholder,
  className,
}: {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const locale = useLocale()
  const t = useTranslations("calendar")
  const labelFormat = React.useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }), [locale])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-56 justify-start gap-2 font-normal", !value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {value ? labelFormat.format(value) : (placeholder ?? t("pickDate"))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={value}
          defaultMonth={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
