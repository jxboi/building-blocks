import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Forgot password" };
export default function ForgotPasswordPage() { return <AuthShell kind="forgotPassword" />; }
