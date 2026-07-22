import { ArrowLeft, MapPinOff } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-lg border bg-card shadow-sm">
          <MapPinOff className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t("notFoundTitle")}</h1>
        <p className="mt-3 leading-7 text-muted-foreground">{t("notFoundDescription")}</p>
        <Button asChild className="mt-8"><Link href="/demo"><ArrowLeft className="size-4" />{t("goHome")}</Link></Button>
      </div>
    </main>
  );
}
