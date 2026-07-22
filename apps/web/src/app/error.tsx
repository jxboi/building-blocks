"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto size-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>
        {error.digest ? <code className="mt-4 block font-mono text-xs text-muted-foreground">Correlation ID: {error.digest}</code> : null}
        <Button className="mt-8" onClick={reset}><RotateCcw className="size-4" />{t("tryAgain")}</Button>
      </div>
    </main>
  );
}
