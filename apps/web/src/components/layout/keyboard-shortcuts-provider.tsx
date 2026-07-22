"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ShortcutContextValue = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
};

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const isTyping = target?.matches("input, textarea, [contenteditable='true']");

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setCommandOpen((open) => !open);
      return;
    }

    if (!isTyping && event.key === "?") {
      event.preventDefault();
      setHelpOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const value = useMemo(
    () => ({ commandOpen, setCommandOpen, helpOpen, setHelpOpen }),
    [commandOpen, helpOpen],
  );

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>;
}

export function useKeyboardShortcuts() {
  const context = useContext(ShortcutContext);
  if (!context) throw new Error("useKeyboardShortcuts must be used within its provider");
  return context;
}
