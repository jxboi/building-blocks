export type Breadcrumb = { label: string; href?: string };

export function workspaceBreadcrumbs({
  workspace,
  section,
  sectionLabel,
}: {
  workspace: string;
  section?: string;
  sectionLabel?: string;
}): Breadcrumb[] {
  const items: Breadcrumb[] = [{ label: "Product", href: `/${workspace}` }];
  if (section && sectionLabel) items.push({ label: sectionLabel });
  return items;
}

export function settingsBreadcrumbs(sectionLabel: string): Breadcrumb[] {
  return [{ label: "Settings", href: "/settings/profile" }, { label: sectionLabel }];
}
