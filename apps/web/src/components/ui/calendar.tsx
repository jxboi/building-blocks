"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
function sameDay(a: Date | undefined, b: Date | undefined) {
  return (
    !!a && !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}
/** Six weeks of dates, Monday-first, covering the given month. */
function buildWeeks(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7 // 0 = Monday
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
  return Array.from({ length: 6 }, (_, week) => cells.slice(week * 7, week * 7 + 7))
}

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date) => void
  defaultMonth?: Date
  month?: Date
  onMonthChange?: (month: Date) => void
  className?: string
}

function Calendar({ selected, onSelect, defaultMonth, month: monthProp, onMonthChange, className }: CalendarProps) {
  const locale = useLocale()
  const t = useTranslations("calendar")
  const monthFormat = React.useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale])
  const fullFormat = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }), [locale])
  const weekdayFormat = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale])
  const weekdayFullFormat = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long" }), [locale])
  const weekdays = React.useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const day = new Date(2024, 0, index + 1)
      return { short: weekdayFormat.format(day), full: weekdayFullFormat.format(day) }
    }),
    [weekdayFormat, weekdayFullFormat]
  )
  const today = React.useMemo(() => startOfDay(new Date()), [])
  const [internalMonth, setInternalMonth] = React.useState(() => {
    const base = defaultMonth ?? selected ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const month = monthProp ?? internalMonth
  const [focusDate, setFocusDate] = React.useState<Date>(() => selected ?? today)
  const gridRef = React.useRef<HTMLDivElement>(null)

  const setMonth = React.useCallback(
    (next: Date) => {
      setInternalMonth(next)
      onMonthChange?.(next)
    },
    [onMonthChange]
  )

  const weeks = React.useMemo(() => buildWeeks(month), [month])

  const moveFocus = React.useCallback(
    (delta: number) => {
      const next = new Date(focusDate)
      next.setDate(focusDate.getDate() + delta)
      setFocusDate(next)
      if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
        setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
      }
    },
    [focusDate, month, setMonth]
  )

  function onKeyDown(event: React.KeyboardEvent) {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const weekday = (focusDate.getDay() + 6) % 7
    if (event.key in deltas) {
      event.preventDefault()
      moveFocus(deltas[event.key] ?? 0)
    } else if (event.key === "Home") {
      event.preventDefault()
      moveFocus(-weekday)
    } else if (event.key === "End") {
      event.preventDefault()
      moveFocus(6 - weekday)
    }
  }

  // Keep DOM focus on the roving day, but only once the grid already owns focus.
  React.useEffect(() => {
    const grid = gridRef.current
    if (!grid || !grid.contains(document.activeElement)) return
    const target = grid.querySelector<HTMLButtonElement>('[data-focus="true"]')
    if (target && target !== document.activeElement) target.focus()
  }, [focusDate])

  const label = monthFormat.format(month)

  function goToday() {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setFocusDate(today)
    onSelect?.(today)
  }

  return (
    <div className={cn("w-fit p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <Button variant="ghost" size="icon-sm" aria-label={t("previousMonth")} onClick={() => setMonth(addMonths(month, -1))}>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <div aria-live="polite" className="text-sm font-medium">
          {label}
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={t("nextMonth")} onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
      <div role="grid" aria-label={label} ref={gridRef} onKeyDown={onKeyDown} className="grid gap-0.5">
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((weekday) => (
            <div key={weekday.full} role="columnheader" aria-label={weekday.full} className="flex h-8 items-center justify-center text-xs font-normal text-muted-foreground">
              {weekday.short}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]?.toISOString()} role="row" className="grid grid-cols-7 gap-0.5">
            {week.map((day) => {
              const outside = day.getMonth() !== month.getMonth()
              const isSelected = sameDay(day, selected)
              const isToday = sameDay(day, today)
              const isFocus = sameDay(day, focusDate)
              return (
                <div role="gridcell" key={day.toISOString()} aria-selected={isSelected}>
                  <button
                    type="button"
                    data-focus={isFocus}
                    tabIndex={isFocus ? 0 : -1}
                    disabled={outside}
                    aria-label={fullFormat.format(day)}
                    aria-current={isToday ? "date" : undefined}
                    onClick={() => {
                      if (outside) return
                      setFocusDate(day)
                      onSelect?.(day)
                    }}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:text-muted-foreground/40",
                      !isSelected && !outside && "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-primary font-medium text-primary-foreground hover:bg-primary/90",
                      isToday && !isSelected && "font-semibold text-foreground"
                    )}
                  >
                    <span className="relative">
                      {day.getDate()}
                      {isToday && !isSelected ? (
                        <span className="absolute inset-x-0 -bottom-1.5 mx-auto size-1 rounded-full bg-primary" />
                      ) : null}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 border-t pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-center font-normal text-muted-foreground hover:text-foreground"
          onClick={goToday}
        >
          {t("today")}
        </Button>
      </div>
    </div>
  )
}

export { Calendar }
