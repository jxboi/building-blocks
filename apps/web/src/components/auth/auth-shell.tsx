import { Check, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { type AuthKind, AuthForm } from "@/components/auth/auth-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { Badge } from "@/components/ui/badge";

export async function AuthShell({ kind }: { kind: AuthKind }) {
  const t = await getTranslations();

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="surface-grid absolute inset-0 opacity-20" aria-hidden="true" />
        <Link href="/login" className="relative flex items-center gap-3">
          <BrandMark />
          <span className="font-semibold tracking-tight">{t("brand.name")}</span>
        </Link>
        <div className="relative my-auto max-w-lg">
          <Badge className="mb-6 border-sidebar-border bg-sidebar-accent text-sidebar-primary" variant="outline">
            <Sparkles className="size-3" />
            {t("auth.eyebrow")}
          </Badge>
          <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight">
            The shell that lets product teams start at the interesting part.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-sidebar-foreground/60">
            Secure sessions, tenant-aware navigation, accessible patterns, and a token-driven system—already composed.
          </p>
          <div className="mt-10 grid gap-4 text-sm text-sidebar-foreground/70">
            {["Tokens and dark mode from day one", "Registry-driven navigation and permissions", "Responsive, keyboard-first interaction patterns"].map((item) => (
              <p key={item} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-sidebar-accent">
                  <Check className="size-3.5 text-sidebar-primary" aria-hidden="true" />
                </span>
                {item}
              </p>
            ))}
          </div>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-sidebar-foreground/40">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t("auth.securityNote")}
        </p>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <BrandMark />
            <span className="font-semibold">{t("brand.name")}</span>
          </div>
          <AuthForm kind={kind} />
        </div>
      </section>
    </main>
  );
}
