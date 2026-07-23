"use client";

import { Boxes, Brain, Check, ChevronDown, FlaskConical, Sparkles, Zap } from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Model = {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  badge: string;
  badgeVariant: "default" | "secondary" | "outline";
  speed: number;
  quality: number;
  context: string;
  disabled?: boolean;
};

const models = [
  {
    id: "atlas",
    name: "Atlas",
    icon: Brain,
    description: "Deepest reasoning for complex, multi-step automations.",
    badge: "Most capable",
    badgeVariant: "default",
    speed: 1,
    quality: 3,
    context: "200K context",
    disabled: false,
  },
  {
    id: "beam",
    name: "Beam",
    icon: Sparkles,
    description: "Balanced quality and latency. A solid everyday default.",
    badge: "Balanced",
    badgeVariant: "secondary",
    speed: 2,
    quality: 2,
    context: "128K context",
    disabled: false,
  },
  {
    id: "bolt",
    name: "Bolt",
    icon: Zap,
    description: "Fastest responses for high-volume, simple tasks.",
    badge: "Fastest",
    badgeVariant: "outline",
    speed: 3,
    quality: 1,
    context: "32K context",
    disabled: false,
  },
  {
    id: "prism",
    name: "Prism",
    icon: FlaskConical,
    description: "Experimental multimodal preview. Not for production.",
    badge: "Preview",
    badgeVariant: "outline",
    speed: 2,
    quality: 3,
    context: "128K context",
    disabled: true,
  },
] as const satisfies readonly Model[];

const styles = ["Precise", "Balanced", "Creative"] as const;

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${label}: ${value} of 3`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn("h-2.5 w-1 rounded-full", step <= value ? "bg-foreground/70" : "bg-muted-foreground/20")}
          />
        ))}
      </span>
    </span>
  );
}

export function ModelSwitcher() {
  const [selected, setSelected] = useState<Model>(models[1]);
  const [style, setStyle] = useState<(typeof styles)[number]>("Balanced");
  const [extendedThinking, setExtendedThinking] = useState(false);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="group/button gap-1.5 font-normal data-[state=open]:bg-muted"
          aria-label={`Model: ${selected.name}`}
        >
          <selected.icon className="size-3.5 text-muted-foreground" />
          <span key={selected.id} className="state-enter hidden sm:inline">{selected.name}</span>
          <ChevronDown className="size-3 text-muted-foreground transition-transform duration-(--duration-slow) group-data-[state=open]/button:rotate-180" strokeWidth={1.8} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between px-3 pt-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Boxes className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
            Model
          </p>
          <span className="font-mono text-xs text-muted-foreground/70">4 available</span>
        </div>

        <div className="flex flex-col gap-0.5 p-1.5" role="radiogroup" aria-label="Model">
          {models.map((model) => {
            const active = model.id === selected.id;
            return (
              <Button
                key={model.id}
                variant="ghost"
                role="radio"
                aria-checked={active}
                disabled={model.disabled}
                onClick={() => setSelected(model)}
                className={cn(
                  "h-auto items-start justify-start gap-2.5 whitespace-normal border border-transparent px-2 py-2 text-left",
                  "hover:bg-muted/60",
                  active && "border-border/70 bg-muted/70",
                )}
              >
                <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <model.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{model.name}</span>
                    <Badge variant={model.badgeVariant} className="px-1.5 py-0 text-xs font-medium">
                      {model.badge}
                    </Badge>
                    {active ? <Check className="ml-auto size-4 text-primary" /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{model.description}</span>
                  <span className="mt-1.5 flex items-center gap-3">
                    <Meter label="Speed" value={model.speed} />
                    <Meter label="Quality" value={model.quality} />
                    <span className="ml-auto font-mono text-xs text-muted-foreground/70">{model.context}</span>
                  </span>
                </span>
              </Button>
            );
          })}
        </div>

        <Separator />
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Response style</span>
            <ToggleGroup
              type="single"
              value={style}
              onValueChange={(value) => value && setStyle(value as (typeof styles)[number])}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {styles.map((item) => (
                <ToggleGroupItem key={item} value={item} className="text-xs">
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <label className="flex items-center justify-between gap-3">
            <span className="flex flex-col">
              <span className="text-sm font-medium">Extended thinking</span>
              <span className="text-xs text-muted-foreground">Let {selected.name} reason before replying.</span>
            </span>
            <Switch checked={extendedThinking} onCheckedChange={setExtendedThinking} />
          </label>
        </div>

        <Separator />
        <div className="p-1.5">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Boxes className="size-3.5" strokeWidth={1.8} />
            Manage models
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
