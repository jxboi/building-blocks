import { notFound } from "next/navigation";
import { AdminView } from "@/components/admin/admin-view";
import { adminSections, isRegisteredSection } from "@/lib/navigation/routes";

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isRegisteredSection(adminSections, section)) notFound();
  return <AdminView section={section} />;
}
