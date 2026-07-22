export const staleTimes = {
  reference: 5 * 60 * 1000,
  content: 30 * 1000,
  live: 0,
} as const;

export const queryKeys = {
  workspace: (workspace: string) => ["workspace", workspace] as const,
  notifications: (workspace: string) => ["workspace", workspace, "notifications"] as const,
  entityList: (workspace: string, entity: string, filters: URLSearchParams) =>
    ["workspace", workspace, entity, filters.toString()] as const,
  flags: (organisationId: string) => ["organisation", organisationId, "flags"] as const,
  permissions: (organisationId: string) =>
    ["organisation", organisationId, "permissions"] as const,
} as const;
