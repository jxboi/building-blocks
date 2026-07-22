"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/kit/form-field";
import { InlineAlert } from "@/components/kit/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/notify";

export type AuthKind = "login" | "register" | "forgotPassword" | "resetPassword" | "verifyEmail" | "invite" | "mfa";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").optional(),
  email: z.email("Enter a valid email address").optional(),
  password: z.string().min(12, "Use at least 12 characters").optional(),
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code").optional(),
});

type AuthValues = z.infer<typeof schema>;

export function AuthForm({ kind }: { kind: AuthKind }) {
  const t = useTranslations("auth");
  const [pending, setPending] = useState(false);
  const form = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", code: "" },
  });

  const showName = kind === "register";
  const showEmail = ["login", "register", "forgotPassword"].includes(kind);
  const showPassword = ["login", "register", "resetPassword"].includes(kind);
  const showCode = kind === "mfa";

  async function onSubmit(values: AuthValues) {
    setPending(true);
    try {
      if (kind === "login") {
        const response = await fetch("/api/session/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!response.ok) throw new Error("The API is not connected yet.");
        window.location.assign("/");
        return;
      }
      notify.success("The frontend flow is ready for its API contract.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "The request could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
          {kind === "verifyEmail" || kind === "invite" ? (
            <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
          ) : (
            <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
          )}
        </div>
        <div>
          <CardTitle className="text-2xl tracking-tight">{t(`${kind}.title`)}</CardTitle>
          <CardDescription className="mt-2 leading-6">{t(`${kind}.description`)}</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="grid gap-5">
          {showName ? (
            <FormField id="name" label={t("name")} error={form.formState.errors.name}>
              <Input
                id="name"
                autoComplete="name"
                placeholder={t("namePlaceholder")}
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
            </FormField>
          ) : null}
          {showEmail ? (
            <FormField id="email" label={t("email")} error={form.formState.errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
            </FormField>
          ) : null}
          {showPassword ? (
            <FormField id="password" label={t("password")} error={form.formState.errors.password}>
              <Input
                id="password"
                type="password"
                autoComplete={kind === "login" ? "current-password" : "new-password"}
                placeholder={t("passwordPlaceholder")}
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              {kind === "login" ? (
                <Link href="/forgot-password" className="justify-self-end text-xs font-medium text-primary hover:underline">
                  {t("forgot")}
                </Link>
              ) : null}
            </FormField>
          ) : null}
          {showCode ? (
            <FormField id="code" label={t("code")} error={form.formState.errors.code}>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="font-mono tracking-widest"
                placeholder={t("codePlaceholder")}
                {...form.register("code")}
              />
            </FormField>
          ) : null}
          {kind === "verifyEmail" || kind === "invite" ? (
            <InlineAlert title="Secure by default" description={t("securityNote")} severity="info" />
          ) : null}
        </CardContent>
        <CardFooter className="mt-6 flex-col items-stretch gap-4 border-t pt-6">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {t(`${kind}.action`)}
          </Button>
          {kind === "login" || kind === "register" ? (
            <p className="text-center text-sm text-muted-foreground">
              {t(`${kind}.alternate`)}{" "}
              <Link
                href={kind === "login" ? "/register" : "/login"}
                className="font-medium text-foreground hover:underline"
              >
                {t(`${kind}.alternateAction`)}
              </Link>
            </p>
          ) : null}
        </CardFooter>
      </form>
    </Card>
  );
}
