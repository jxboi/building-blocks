import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignCatalogue } from "@/components/design/design-catalogue";

export const metadata: Metadata = { title: "Design system" };
export const dynamic = "force-dynamic";

export default function DesignPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DESIGN_CATALOGUE !== "true") {
    notFound();
  }
  return <DesignCatalogue />;
}
