/**
 * Terminology glossary: one canonical name per concept. Kept beside the tokens
 * because naming is part of the design system — the same concept must read the
 * same everywhere (UI copy, docs, code). CONTRIBUTING.md points here; the
 * `/design` catalogue renders it.
 */
export type GlossaryTerm = {
  /** The canonical term to use in UI copy and docs. */
  term: string;
  /** What it means. */
  meaning: string;
  /** Terms to avoid for the same concept. */
  avoid: readonly string[];
};

export const glossary: readonly GlossaryTerm[] = [
  { term: "organisation", meaning: "The top-level customer boundary that owns workspaces, members, and billing.", avoid: ["company", "account", "tenant"] },
  { term: "workspace", meaning: "A container for product work inside an organisation; appears in the URL.", avoid: ["project", "space", "team space"] },
  { term: "member", meaning: "A person who belongs to an organisation.", avoid: ["user", "seat", "collaborator"] },
  { term: "team", meaning: "A named set of members used for assignment and permissions.", avoid: ["group", "squad"] },
  { term: "role", meaning: "A named set of permissions granted to a principal.", avoid: ["permission group", "access level"] },
  { term: "approval", meaning: "A gated decision step that must be granted before an action proceeds.", avoid: ["review", "sign-off", "authorisation"] },
];
