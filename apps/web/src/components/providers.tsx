"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { KeyboardShortcutsProvider } from "@/components/layout/keyboard-shortcuts-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FeatureProvider } from "@/lib/features/feature-context";
import { PermissionProvider } from "@/lib/permissions/permission-context";

export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: true,
            staleTime: 30_000,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem nonce={nonce}>
      <QueryClientProvider client={queryClient}>
        <FeatureProvider>
          <PermissionProvider>
            <TooltipProvider delayDuration={300}>
              <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
              <Toaster richColors position="bottom-right" />
            </TooltipProvider>
          </PermissionProvider>
        </FeatureProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
