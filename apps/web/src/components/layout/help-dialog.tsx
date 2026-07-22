"use client";

import { ExternalLink, Keyboard, LifeBuoy, MessageSquareText } from "lucide-react";

import { useKeyboardShortcuts } from "@/components/layout/keyboard-shortcuts-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const shortcuts = [
  ["Open command palette", "⌘ K"],
  ["Show shortcuts", "?"],
  ["Go to overview", "G then O"],
  ["Go to search", "G then S"],
] as const;

export function HelpDialog() {
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts();

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="size-5 text-primary" aria-hidden="true" />
            Help and shortcuts
          </DialogTitle>
          <DialogDescription>
            Move through the shell quickly or open the documentation for the current feature.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {shortcuts.map(([label, key]) => (
            <div key={label} className="flex min-h-10 items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Keyboard className="size-4" aria-hidden="true" />
                {label}
              </span>
              <kbd className="rounded-md border bg-muted px-2 py-1 font-mono text-xs">{key}</kbd>
            </div>
          ))}
        </div>
        <Separator />
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" className="justify-start">
            <ExternalLink className="size-4" />
            Open documentation
          </Button>
          <Button variant="outline" className="justify-start">
            <MessageSquareText className="size-4" />
            Send feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
