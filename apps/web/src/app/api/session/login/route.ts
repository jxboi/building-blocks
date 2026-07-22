import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAccessToken } from "@/lib/auth/session-cache";

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(512),
});

type LoginEnvelope = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user?: unknown;
};

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) {
    return NextResponse.json({ title: "Request too large", status: 413 }, { status: 413 });
  }
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ title: "Invalid sign-in request", status: 400 }, { status: 400 });
  }

  try {
    const baseUrl = process.env.API_BASE_URL ?? "http://localhost:5000";
    const upstream = await fetch(new URL("/api/v1/auth/login", baseUrl), {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(8_000),
    });
    if (!upstream.ok) {
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") ?? "application/problem+json", "cache-control": "no-store" },
      });
    }

    const envelope = (await upstream.json()) as LoginEnvelope;
    if (!envelope.accessToken || !envelope.refreshToken) throw new Error("Invalid token envelope");
    writeAccessToken(envelope.refreshToken, envelope.accessToken, envelope.expiresIn ?? 300);
    const response = NextResponse.json({ user: envelope.user ?? null }, { headers: { "cache-control": "no-store" } });
    response.cookies.set("bb_refresh", envelope.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { title: "API unavailable", status: 503, detail: "Sign-in is ready but the API is not connected." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
