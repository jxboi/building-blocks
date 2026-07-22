import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Demo workspace" };
export const dynamic = "force-dynamic";

export default function DemoPage() {
  return <AppShell workspace="acme"><DashboardView demo /></AppShell>;
}
