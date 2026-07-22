import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function ErrorExamplePage() {
  const t = await getTranslations("errors");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto size-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>
        <code className="mt-4 block font-mono text-xs text-muted-foreground">Correlation ID: demo-01J4P7</code>
        <Button asChild className="mt-8"><Link href="/demo">{t("goHome")}</Link></Button>
      </div>
    </main>
  );
}
