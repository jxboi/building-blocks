import { type NextRequest, NextResponse } from "next/server";

import {
  createContentSecurityPolicy,
  createNonce,
  securityHeaders,
} from "@/lib/security/headers";

const protectedPrefixes = ["/admin", "/settings"];
const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/invite",
  "/mfa",
  "/403",
  "/demo",
  "/design",
];

function isProtectedPath(pathname: string) {
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return false;
  }
  return /^\/[a-z0-9][a-z0-9-]*(?:\/|$)/.test(pathname);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("bb_refresh");

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const nonce = createNonce();
  const csp = createContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("x-build-id", process.env.BUILD_ID ?? "development");

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Build-Id", process.env.BUILD_ID ?? "development");

  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
