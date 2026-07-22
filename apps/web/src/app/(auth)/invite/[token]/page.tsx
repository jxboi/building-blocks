import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Accept invitation" };
export default function InvitePage() { return <AuthShell kind="invite" />; }
