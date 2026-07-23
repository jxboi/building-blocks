"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"))
const MINUTES = ["00", "15", "30", "45"]

function TimePicker({
  value = "09:00",
  onChange,
  className,
}: {
  value?: string
  onChange?: (value: string) => void
  className?: string
}) {
  const [hour, minute] = value.split(":")
  const t = useTranslations("calendar")

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Select value={hour} onValueChange={(next) => onChange?.(`${next}:${minute}`)}>
        <SelectTrigger className="w-16 justify-center" aria-label={t("hour")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-16">
          {HOURS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">:</span>
      <Select value={minute} onValueChange={(next) => onChange?.(`${hour}:${next}`)}>
        <SelectTrigger className="w-16 justify-center" aria-label={t("minute")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-16">
          {MINUTES.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { TimePicker }
