import { ArrowRight, ShieldX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function ForbiddenPage() {
  const t = await getTranslations("errors");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-lg border bg-card">
          <ShieldX className="size-6 text-destructive" aria-hidden="true" />
        </span>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">403</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t("forbiddenTitle")}</h1>
        <p className="mt-3 leading-7 text-muted-foreground">{t("forbiddenDescription")}</p>
        <Button asChild className="mt-8"><Link href="/demo">{t("goHome")}<ArrowRight className="size-4" /></Link></Button>
      </div>
    </main>
  );
}
