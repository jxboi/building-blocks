import {
  Bell,
  Building2,
  Cable,
  CalendarClock,
  ChartColumn,
  CreditCard,
  FileText,
  KeyRound,
  LayoutGrid,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  UserRound,
  UsersRound,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Canonical icon per entity type. Nav, search results, notifications, and
 * breadcrumbs all resolve through this map, so a given entity looks the same
 * everywhere it appears. Adding an entity type is a compile error until it has
 * an icon here (the `Record` is exhaustive) — the registry-over-scatter rule
 * applied to iconography.
 */
export type EntityKind =
  | "organisation"
  | "workspace"
  | "member"
  | "team"
  | "role"
  | "apiKey"
  | "webhook"
  | "report"
  | "file"
  | "notification"
  | "audit"
  | "billing"
  | "connection"
  | "schedule"
  | "feedback";

export const entityIcons: Record<EntityKind, LucideIcon> = {
  organisation: Building2,
  workspace: LayoutGrid,
  member: UserRound,
  team: UsersRound,
  role: ShieldCheck,
  apiKey: KeyRound,
  webhook: Webhook,
  report: ChartColumn,
  file: FileText,
  notification: Bell,
  audit: ScrollText,
  billing: CreditCard,
  connection: Cable,
  schedule: CalendarClock,
  feedback: MessageSquare,
};

/** Resolve the canonical icon for an entity type. */
export function entityIcon(kind: EntityKind): LucideIcon {
  return entityIcons[kind];
}
