import { type NextRequest, NextResponse } from "next/server";

import { deleteSession } from "@/lib/auth/session-cache";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("bb_refresh")?.value;
  if (refreshToken) deleteSession(refreshToken);
  const response = new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
  response.cookies.delete("bb_refresh");
  return response;
}
