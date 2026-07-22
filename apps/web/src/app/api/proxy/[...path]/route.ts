import { type NextRequest, NextResponse } from "next/server";

import { buildDownstreamHeaders, buildUpstreamHeaders, safeUpstreamUrl } from "@/lib/api/proxy-adapter";
import { resolveSession } from "@/lib/auth/resolve-session";

export const dynamic = "force-dynamic";

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const refreshToken = request.cookies.get("bb_refresh")?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { title: "Authentication required", status: 401 },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const session = await resolveSession(refreshToken);
    if (!session) {
      const response = NextResponse.json(
        { title: "Session expired", status: 401 },
        { status: 401, headers: { "cache-control": "no-store" } },
      );
      response.cookies.delete("bb_refresh");
      return response;
    }

    const { path } = await context.params;
    const url = safeUpstreamUrl(path, request.nextUrl.search);
    if (!url) return NextResponse.json({ title: "Invalid API path", status: 400 }, { status: 400 });

    const upstreamRequest = new Request(url, request);
    const headers = buildUpstreamHeaders(request.headers, session.accessToken);
    for (const [name, value] of headers.entries()) upstreamRequest.headers.set(name, value);
    upstreamRequest.headers.delete("cookie");

    const upstream = await fetch(upstreamRequest, { cache: "no-store", redirect: "manual" });
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildDownstreamHeaders(upstream.headers),
    });
    if (session.rotated) setRefreshCookie(response, session.refreshToken);
    return response;
  } catch {
    return NextResponse.json(
      { title: "API unavailable", status: 503, detail: "The upstream service could not be reached." },
      { status: 503, headers: { "cache-control": "no-store", "retry-after": "5" } },
    );
  }
}

function setRefreshCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set("bb_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
