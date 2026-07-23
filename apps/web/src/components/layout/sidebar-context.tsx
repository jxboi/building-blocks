"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "shell:sidebar-collapsed";
const listeners = new Set<() => void>();

function readCollapsed(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "true";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeCollapsed(next: boolean) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(next));
  for (const listener of listeners) listener();
}

/**
 * Binds the `[` shortcut that toggles the rail. Collapse state itself lives in an
 * external store (below) read through `useSyncExternalStore`, so it survives across
 * every shell that mounts a sidebar and hydrates without a mismatch.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches("input, textarea, [contenteditable='true']");
      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "[") {
        event.preventDefault();
        writeCollapsed(!readCollapsed());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <>{children}</>;
}

export function useSidebar() {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const setCollapsed = useCallback((next: boolean) => writeCollapsed(next), []);
  const toggleCollapsed = useCallback(() => writeCollapsed(!readCollapsed()), []);
  return { collapsed, setCollapsed, toggleCollapsed };
}
