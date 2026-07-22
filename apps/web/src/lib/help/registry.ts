import { navigationRegistry, resolveHref } from "@/lib/navigation/registry";

export function helpForPath(pathname: string, workspace = "acme") {
  return navigationRegistry.find(
    (item) => resolveHref(item, workspace) === pathname,
  )?.helpUrl;
}

export const globalHelpLinks = [
  { label: "Documentation home", href: process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.example.com" },
  { label: "Keyboard shortcuts", href: "#shortcuts" },
  { label: "Send feedback", href: "/settings/feedback" },
] as const;
