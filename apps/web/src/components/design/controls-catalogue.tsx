"use client";

import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Copy, Italic, Pencil, Trash2, Underline } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TimePicker } from "@/components/ui/time-picker";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="grid gap-6 py-6">{children}</CardContent>
      </Card>
    </section>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2.5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex min-h-9 flex-wrap items-center gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

export function ControlsCatalogue() {
  const [range, setRange] = useState("week");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:30");
  const densities = ["cozy", "comfortable", "compact"] as const;

  return (
    <div className="grid gap-8">
      <Section title="Selection" description="Checkboxes and radios for multi- and single-select. Each pairs with a label for assistive tech.">
        <Spec label="Checkbox">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-updates" defaultChecked />
            <Label htmlFor="cb-updates">Product updates</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-security" />
            <Label htmlFor="cb-security">Security alerts</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-mixed" checked="indeterminate" />
            <Label htmlFor="cb-mixed">Some workspaces</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled" disabled />
            <Label htmlFor="cb-disabled" className="text-muted-foreground">Disabled</Label>
          </div>
        </Spec>
        <Spec label="Radio group">
          <RadioGroup defaultValue="comfortable" className="flex flex-wrap gap-x-6 gap-y-3">
            {densities.map((value) => (
              <div key={value} className="flex items-center gap-2">
                <RadioGroupItem value={value} id={`rg-${value}`} />
                <Label htmlFor={`rg-${value}`} className="capitalize">{value}</Label>
              </div>
            ))}
          </RadioGroup>
        </Spec>
      </Section>

      <Section title="Toggles & switches" description="Binary and pressed states. Switches flip a setting; toggles press a value; toggle groups pick from a set.">
        <Spec label="Switch">
          <div className="flex items-center gap-2">
            <Switch id="sw-auto" defaultChecked />
            <Label htmlFor="sw-auto">Auto-archive</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="sw-beta" />
            <Label htmlFor="sw-beta">Beta features</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="sw-locked" disabled defaultChecked />
            <Label htmlFor="sw-locked" className="text-muted-foreground">Enforced</Label>
          </div>
        </Spec>
        <Spec label="Toggle">
          <Toggle aria-label="Bold"><Bold /></Toggle>
          <Toggle variant="outline" aria-label="Italic"><Italic /></Toggle>
          <Toggle defaultPressed aria-label="Underline"><Underline /></Toggle>
        </Spec>
        <Spec label="Toggle group">
          <ToggleGroup type="multiple" variant="outline" defaultValue={["bold"]}>
            <ToggleGroupItem value="bold" aria-label="Bold"><Bold /></ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic"><Italic /></ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline"><Underline /></ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" variant="outline" defaultValue="left">
            <ToggleGroupItem value="left" aria-label="Align left"><AlignLeft /></ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center"><AlignCenter /></ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right"><AlignRight /></ToggleGroupItem>
          </ToggleGroup>
        </Spec>
      </Section>

      <Section title="Menus & selects" description="One dropdown primitive family. Select picks a value; the dropdown menu triggers actions.">
        <Spec label="Select">
          <Select defaultValue="medium">
            <SelectTrigger className="w-44" aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low priority</SelectItem>
              <SelectItem value="medium">Medium priority</SelectItem>
              <SelectItem value="high">High priority</SelectItem>
            </SelectContent>
          </Select>
        </Spec>
        <Spec label="Button group">
          <ButtonGroup>
            {["day", "week", "month"].map((value) => (
              <Button
                key={value}
                variant={range === value ? "secondary" : "outline"}
                aria-pressed={range === value}
                onClick={() => setRange(value)}
                className="capitalize"
              >
                {value}
              </Button>
            ))}
          </ButtonGroup>
        </Spec>
        <Spec label="Dropdown menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Options
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem><Pencil />Edit</DropdownMenuItem>
              <DropdownMenuItem><Copy />Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive"><Trash2 />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Spec>
      </Section>

      <Section title="Range" description="Sliders for a single value or a bounded range; keyboard-adjustable via arrow keys.">
        <Spec label="Single">
          <Slider defaultValue={[40]} max={100} step={1} className="max-w-xs" aria-label="Volume" />
        </Spec>
        <Spec label="Range">
          <Slider defaultValue={[25, 75]} max={100} step={1} className="max-w-xs" aria-label="Price range" />
        </Spec>
      </Section>

      <Section title="Date & time" description="A popover date picker, a time picker, and the inline calendar they share — hand-built, keyboard-navigable.">
        <Spec label="Date picker">
          <DatePicker value={date} onChange={setDate} />
        </Spec>
        <Spec label="Time picker">
          <TimePicker value={time} onChange={setTime} />
        </Spec>
        <Spec label="Inline calendar">
          <Calendar selected={date} onSelect={setDate} className="rounded-lg border bg-card shadow-xs" />
        </Spec>
      </Section>
    </div>
  );
}
