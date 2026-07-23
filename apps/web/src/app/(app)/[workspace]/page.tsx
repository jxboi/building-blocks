import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Overview" };
export default async function WorkspacePage({ params }: PageProps<"/[workspace]">) {
  const { workspace } = await params;

  return <DashboardView workspace={workspace} />;
}
