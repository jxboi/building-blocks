"use client";

import { createContext, useContext } from "react";

const defaultPermissions = new Set([
  "workspace.view",
  "workspace.search",
  "approvals.view",
  "reports.view",
  "settings.view",
  "admin.view",
]);

const PermissionContext = createContext<ReadonlySet<string>>(defaultPermissions);

export function PermissionProvider({
  children,
  permissions = defaultPermissions,
}: {
  children: React.ReactNode;
  permissions?: ReadonlySet<string>;
}) {
  return (
    <PermissionContext.Provider value={permissions}>{children}</PermissionContext.Provider>
  );
}

export function useCan(permission?: string) {
  const permissions = useContext(PermissionContext);
  return permission ? permissions.has(permission) : true;
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return useCan(permission) ? children : fallback;
}
