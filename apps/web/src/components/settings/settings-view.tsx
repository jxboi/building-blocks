import { Save, ShieldCheck } from "lucide-react";

import { ConfirmationDialog } from "@/components/kit/confirmation-dialog";
import { InlineAlert } from "@/components/kit/inline-alert";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SettingsSection } from "@/lib/navigation/routes";

const sectionCopy: Record<SettingsSection, { title: string; description: string; scope: string }> = {
  profile: { title: "Profile", description: "Manage how your name and profile appear to people you work with.", scope: "Personal settings" },
  security: { title: "Security", description: "Protect your account with a strong password and multi-factor authentication.", scope: "Personal settings" },
  sessions: { title: "Sessions", description: "Review browsers and devices that currently have access to your account.", scope: "Personal settings" },
  notifications: { title: "Notifications", description: "Choose which events reach you and how they are delivered.", scope: "Personal settings" },
  preferences: { title: "Preferences", description: "Set your locale, timezone, density, and interaction preferences.", scope: "Personal settings" },
  feedback: { title: "Feedback", description: "Share an idea or report a problem with useful product context attached.", scope: "Personal settings" },
  organisation: { title: "Organisation", description: "Manage identity, ownership, and lifecycle settings for Acme Studio.", scope: "Organisation settings" },
  members: { title: "Members", description: "Invite people and review their organisation access.", scope: "Organisation settings" },
  teams: { title: "Teams", description: "Group members into reusable principals for access and assignment.", scope: "Organisation settings" },
  roles: { title: "Roles", description: "Compose permissions into roles that remain easy to explain and audit.", scope: "Organisation settings" },
  billing: { title: "Billing", description: "Review subscription, invoices, plan entitlements, and payment status.", scope: "Organisation settings" },
  usage: { title: "Usage", description: "Understand seats, storage, runs, and other entitlement-backed usage.", scope: "Organisation settings" },
  audit: { title: "Audit log", description: "Trace security and business events without exposing sensitive field values.", scope: "Organisation settings" },
  "api-keys": { title: "API keys", description: "Create scoped credentials for trusted machine-to-machine access.", scope: "Organisation settings" },
  webhooks: { title: "Webhooks", description: "Deliver signed events to systems that need to react outside the platform.", scope: "Organisation settings" },
  connections: { title: "Connections", description: "Manage provider connections and their encrypted credentials.", scope: "Organisation settings" },
  schedules: { title: "Schedules", description: "Control user-owned recurring actions in the organisation timezone.", scope: "Organisation settings" },
};

export function SettingsView({ section }: { section: SettingsSection }) {
  const copy = sectionCopy[section];
  const destructive = section === "organisation";

  return (
    <>
      <PageHeader
        eyebrow={copy.scope}
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: "Settings", href: "/settings/profile" }, { label: copy.title }]}
      />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:px-8 md:py-8">
        <InlineAlert
          title="Frontend contract ready"
          description="This settings route uses the shared shell and can be connected to the generated API types when its owning module lands."
          severity="info"
        />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>{copy.title} details</CardTitle>
                <CardDescription>Fields here demonstrate the shared form density and messaging rules.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input id="display-name" defaultValue={section === "organisation" ? "Acme Studio" : "Ada Lovelace"} />
              <p className="text-xs leading-5 text-muted-foreground">Sentence case, clear labels, and help text that explains impact.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" defaultValue="Asia/Singapore" />
              <p className="text-xs leading-5 text-muted-foreground">Used for schedules, reports, and date-based dashboard buckets.</p>
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t pt-6">
            <Button><Save className="size-4" />Save changes</Button>
          </CardFooter>
        </Card>
        {destructive ? (
          <Card className="border-destructive/25">
            <CardHeader>
              <CardTitle>Delete organisation</CardTitle>
              <CardDescription>Irreversible actions use the shared name-typing confirmation pattern.</CardDescription>
            </CardHeader>
            <CardFooter>
              <ConfirmationDialog
                title="Delete Acme Studio?"
                description="This schedules deletion after the configured grace period and signs every member out."
                triggerLabel="Delete organisation"
                confirmationText="Acme Studio"
              />
            </CardFooter>
          </Card>
        ) : null}
      </div>
    </>
  );
}
