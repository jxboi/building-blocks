import "server-only";

import { deleteSession, readAccessToken, writeAccessToken } from "@/lib/auth/session-cache";

type TokenEnvelope = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export type ResolvedSession = { accessToken: string; refreshToken: string; rotated: boolean };

export async function resolveSession(refreshToken: string): Promise<ResolvedSession | undefined> {
  const cached = readAccessToken(refreshToken);
  if (cached) return { accessToken: cached, refreshToken, rotated: false };

  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:5000";
  const response = await fetch(new URL("/api/v1/auth/refresh", baseUrl), {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    deleteSession(refreshToken);
    return undefined;
  }

  const tokens = (await response.json()) as TokenEnvelope;
  if (!tokens.accessToken) return undefined;
  const nextRefreshToken = tokens.refreshToken ?? refreshToken;
  if (nextRefreshToken !== refreshToken) deleteSession(refreshToken);
  writeAccessToken(nextRefreshToken, tokens.accessToken, tokens.expiresIn ?? 300);
  return {
    accessToken: tokens.accessToken,
    refreshToken: nextRefreshToken,
    rotated: nextRefreshToken !== refreshToken,
  };
}
