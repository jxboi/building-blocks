import type { ComponentType } from "react";
import {
  Activity,
  Bell,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  CircleUserRound,
  CreditCard,
  FileCheck2,
  Flag,
  Gauge,
  KeyRound,
  Link2,
  ListChecks,
  LockKeyhole,
  Mail,
  MessageSquareText,
  PanelsTopLeft,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  UsersRound,
  Webhook,
  Workflow,
} from "lucide-react";

export type NavigationScope = "workspace" | "user" | "organisation" | "admin";

export type NavigationSubItem = {
  id: string;
  labelKey: `nav.${string}`;
  href: string | ((workspace: string) => string);
  badge?: string;
};

export type NavigationItem = {
  id: string;
  labelKey: `nav.${string}`;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
  href: string | ((workspace: string) => string);
  scope: NavigationScope;
  featureKey?: string;
  permission?: string;
  helpUrl?: string;
  shortcut?: string;
  badge?: string;
  children?: readonly NavigationSubItem[];
};

const docsBase = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.example.com";

export const navigationRegistry: readonly NavigationItem[] = [
  { id: "overview", labelKey: "nav.overview", icon: PanelsTopLeft, href: (workspace) => `/${workspace}`, scope: "workspace", permission: "workspace.view", shortcut: "g o", helpUrl: `${docsBase}/overview` },
  { id: "search", labelKey: "nav.search", icon: Search, href: (workspace) => `/${workspace}/search`, scope: "workspace", permission: "workspace.search", shortcut: "g s", helpUrl: `${docsBase}/search` },
  { id: "notifications", labelKey: "nav.notifications", icon: Bell, href: (workspace) => `/${workspace}/notifications`, scope: "workspace", shortcut: "g n", badge: "3" },
  { id: "messages", labelKey: "nav.messages", icon: MessageSquareText, href: (workspace) => `/${workspace}/messages`, scope: "workspace", featureKey: "messages" },
  {
    id: "approvals",
    labelKey: "nav.approvals",
    icon: FileCheck2,
    href: (workspace) => `/${workspace}/approvals`,
    scope: "workspace",
    featureKey: "approvals",
    permission: "approvals.view",
    badge: "9",
    children: [
      { id: "approvals-pending", labelKey: "nav.approvalsPending", href: (workspace) => `/${workspace}/approvals#pending`, badge: "9" },
      { id: "approvals-mine", labelKey: "nav.approvalsMine", href: (workspace) => `/${workspace}/approvals#mine` },
      { id: "approvals-history", labelKey: "nav.approvalsHistory", href: (workspace) => `/${workspace}/approvals#history` },
    ],
  },
  {
    id: "reports",
    labelKey: "nav.reports",
    icon: ChartNoAxesCombined,
    href: (workspace) => `/${workspace}/reports`,
    scope: "workspace",
    featureKey: "reports",
    permission: "reports.view",
    children: [
      { id: "reports-overview", labelKey: "nav.reportsOverview", href: (workspace) => `/${workspace}/reports#overview` },
      { id: "reports-funnels", labelKey: "nav.reportsFunnels", href: (workspace) => `/${workspace}/reports#funnels` },
      { id: "reports-retention", labelKey: "nav.reportsRetention", href: (workspace) => `/${workspace}/reports#retention` },
      { id: "reports-exports", labelKey: "nav.reportsExports", href: (workspace) => `/${workspace}/reports#exports`, badge: "New" },
    ],
  },
  { id: "profile", labelKey: "nav.profile", icon: CircleUserRound, href: "/settings/profile", scope: "user", permission: "settings.view" },
  { id: "security", labelKey: "nav.security", icon: ShieldCheck, href: "/settings/security", scope: "user", permission: "settings.view" },
  { id: "sessions", labelKey: "nav.sessions", icon: LockKeyhole, href: "/settings/sessions", scope: "user", permission: "settings.view" },
  { id: "notification-settings", labelKey: "nav.notifications", icon: Bell, href: "/settings/notifications", scope: "user", permission: "settings.view" },
  { id: "preferences", labelKey: "nav.preferences", icon: SlidersHorizontal, href: "/settings/preferences", scope: "user", permission: "settings.view" },
  { id: "feedback", labelKey: "nav.feedback", icon: MessageSquareText, href: "/settings/feedback", scope: "user", permission: "settings.view" },
  { id: "organisation", labelKey: "nav.organisation", icon: Building2, href: "/settings/organisation", scope: "organisation", permission: "settings.view" },
  { id: "members", labelKey: "nav.members", icon: Users, href: "/settings/members", scope: "organisation", permission: "settings.view" },
  { id: "teams", labelKey: "nav.teams", icon: UsersRound, href: "/settings/teams", scope: "organisation", permission: "settings.view" },
  { id: "roles", labelKey: "nav.roles", icon: ShieldCheck, href: "/settings/roles", scope: "organisation", permission: "settings.view" },
  { id: "billing", labelKey: "nav.billing", icon: CreditCard, href: "/settings/billing", scope: "organisation", featureKey: "billing", permission: "settings.view" },
  { id: "usage", labelKey: "nav.usage", icon: Gauge, href: "/settings/usage", scope: "organisation", permission: "settings.view" },
  { id: "audit", labelKey: "nav.audit", icon: Activity, href: "/settings/audit", scope: "organisation", permission: "settings.view" },
  { id: "api-keys", labelKey: "nav.apiKeys", icon: KeyRound, href: "/settings/api-keys", scope: "organisation", permission: "settings.view" },
  { id: "webhooks", labelKey: "nav.webhooks", icon: Webhook, href: "/settings/webhooks", scope: "organisation", permission: "settings.view" },
  { id: "connections", labelKey: "nav.connections", icon: Link2, href: "/settings/connections", scope: "organisation", permission: "settings.view" },
  { id: "schedules", labelKey: "nav.schedules", icon: CalendarClock, href: "/settings/schedules", scope: "organisation", permission: "settings.view" },
  { id: "admin-users", labelKey: "nav.adminUsers", icon: Users, href: "/admin/users", scope: "admin", permission: "admin.view" },
  { id: "admin-organisations", labelKey: "nav.adminOrganisations", icon: Building2, href: "/admin/organisations", scope: "admin", permission: "admin.view" },
  { id: "admin-audit", labelKey: "nav.adminAudit", icon: ListChecks, href: "/admin/audit", scope: "admin", permission: "admin.view" },
  { id: "admin-flags", labelKey: "nav.adminFlags", icon: Flag, href: "/admin/flags", scope: "admin", permission: "admin.view" },
  { id: "admin-email", labelKey: "nav.adminEmail", icon: Mail, href: "/admin/email", scope: "admin", permission: "admin.view" },
  { id: "admin-jobs", labelKey: "nav.adminJobs", icon: Workflow, href: "/admin/jobs", scope: "admin", permission: "admin.view" },
  { id: "admin-billing", labelKey: "nav.adminBilling", icon: CreditCard, href: "/admin/billing", scope: "admin", permission: "admin.view" },
  { id: "admin-settings", labelKey: "nav.adminSettings", icon: Settings2, href: "/admin/settings", scope: "admin", permission: "admin.view" },
] as const;

export function navItemsForScope(scope: NavigationScope) {
  return navigationRegistry.filter((item) => item.scope === scope);
}

export function resolveHref(item: NavigationItem, workspace: string) {
  return typeof item.href === "function" ? item.href(workspace) : item.href;
}
