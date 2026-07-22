import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell workspace="acme" scopes={["user", "organisation"]}>{children}</AppShell>;
}
