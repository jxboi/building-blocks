import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Verify identity" };
export default function MfaPage() { return <AuthShell kind="mfa" />; }
