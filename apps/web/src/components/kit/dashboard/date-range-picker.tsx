"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ranges = ["Last 7 days", "Last 30 days", "This quarter", "This year"] as const;
type Range = (typeof ranges)[number];

export function DateRangePicker() {
  const [range, setRange] = useState<Range>("Last 30 days");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="group/button font-normal text-muted-foreground data-[state=open]:bg-muted"
          aria-label={`Date range: ${range}`}
        >
          <CalendarDays className="size-3.5" strokeWidth={1.8} />
          <span key={range} className="state-enter">{range}</span>
          <ChevronDown className="size-3 text-muted-foreground transition-transform duration-(--duration-slow) group-data-[state=open]/button:rotate-180" strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={range} onValueChange={(value) => setRange(value as Range)}>
          {ranges.map((item) => (
            <DropdownMenuRadioItem key={item} value={item}>{item}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
