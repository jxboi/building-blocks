import "server-only";

import { createHash } from "node:crypto";

type CachedAccessToken = { accessToken: string; expiresAt: number };
type SessionCache = Map<string, CachedAccessToken>;

let sessionCache: SessionCache | undefined;

function getSessionCache() {
  sessionCache ??= new Map();
  return sessionCache;
}

function keyFor(refreshToken: string) {
  return createHash("sha256").update(refreshToken).digest("base64url");
}

export function readAccessToken(refreshToken: string) {
  const key = keyFor(refreshToken);
  const cached = getSessionCache().get(key);
  if (!cached || cached.expiresAt <= Date.now() + 10_000) {
    getSessionCache().delete(key);
    return undefined;
  }
  return cached.accessToken;
}

export function writeAccessToken(refreshToken: string, accessToken: string, expiresInSeconds: number) {
  const cache = getSessionCache();
  if (cache.size > 10_000) cache.clear();
  cache.set(keyFor(refreshToken), {
    accessToken,
    expiresAt: Date.now() + Math.max(30, expiresInSeconds) * 1000,
  });
}

export function deleteSession(refreshToken: string) {
  getSessionCache().delete(keyFor(refreshToken));
}
