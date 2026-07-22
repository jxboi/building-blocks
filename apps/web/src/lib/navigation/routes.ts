export const workspaceSections = [
  "search",
  "notifications",
  "messages",
  "approvals",
  "reports",
] as const;

export const settingsSections = [
  "profile",
  "security",
  "sessions",
  "notifications",
  "preferences",
  "feedback",
  "organisation",
  "members",
  "teams",
  "roles",
  "billing",
  "usage",
  "audit",
  "api-keys",
  "webhooks",
  "connections",
  "schedules",
] as const;

export const adminSections = [
  "users",
  "organisations",
  "audit",
  "flags",
  "email",
  "jobs",
  "billing",
  "settings",
] as const;

export type WorkspaceSection = (typeof workspaceSections)[number];
export type SettingsSection = (typeof settingsSections)[number];
export type AdminSection = (typeof adminSections)[number];

export function isRegisteredSection<T extends string>(
  sections: readonly T[],
  value: string,
): value is T {
  return sections.includes(value as T);
}
