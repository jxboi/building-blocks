import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Verify email" };
export default function VerifyEmailPage() { return <AuthShell kind="verifyEmail" />; }
