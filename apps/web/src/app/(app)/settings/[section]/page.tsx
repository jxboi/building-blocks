import { notFound } from "next/navigation";

import { SettingsView } from "@/components/settings/settings-view";
import { isRegisteredSection, settingsSections } from "@/lib/navigation/routes";

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isRegisteredSection(settingsSections, section)) notFound();
  return <SettingsView section={section} />;
}
