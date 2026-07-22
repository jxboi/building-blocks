import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Reset password" };
export default function ResetPasswordPage() { return <AuthShell kind="resetPassword" />; }
