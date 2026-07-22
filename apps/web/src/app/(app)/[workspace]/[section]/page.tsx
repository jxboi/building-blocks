import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ModulePlaceholder } from "@/components/pages/module-placeholder";
import { isRegisteredSection, workspaceSections } from "@/lib/navigation/routes";

export default async function WorkspaceSectionPage({ params }: { params: Promise<{ workspace: string; section: string }> }) {
  const { workspace, section } = await params;
  if (!isRegisteredSection(workspaceSections, section)) notFound();
  const t = await getTranslations();
  return (
    <ModulePlaceholder
      title={t(`pages.${section}.title`)}
      description={t(`pages.${section}.description`)}
      eyebrow="Workspace module"
      breadcrumbs={[{ label: "Product", href: `/${workspace}` }, { label: t(`pages.${section}.title`) }]}
    />
  );
}
