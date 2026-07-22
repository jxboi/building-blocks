const allowedRequestHeaders = new Set([
  "accept",
  "content-type",
  "if-match",
  "if-none-match",
  "range",
  "x-correlation-id",
  "x-idempotency-key",
]);

const allowedResponseHeaders = new Set([
  "cache-control",
  "content-disposition",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
  "location",
  "retry-after",
  "x-build-id",
  "x-correlation-id",
]);

export function buildUpstreamHeaders(incoming: Headers, accessToken: string) {
  const headers = new Headers();
  for (const [name, value] of incoming.entries()) {
    if (allowedRequestHeaders.has(name.toLowerCase())) headers.set(name, value);
  }
  headers.set("authorization", `Bearer ${accessToken}`);
  if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", crypto.randomUUID());
  return headers;
}

export function buildDownstreamHeaders(upstream: Headers) {
  const headers = new Headers();
  for (const [name, value] of upstream.entries()) {
    if (allowedResponseHeaders.has(name.toLowerCase())) headers.set(name, value);
  }
  headers.set("cache-control", upstream.get("cache-control") ?? "no-store");
  return headers;
}

export function safeUpstreamUrl(path: string[], search: string) {
  if (
    !path.length ||
    path.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        !/^[a-zA-Z0-9._~-]+$/.test(segment),
    )
  ) {
    return undefined;
  }
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:5000";
  const encodedPath = path.map(encodeURIComponent).join("/");
  const url = new URL(`/api/v1/${encodedPath}`, baseUrl);
  url.search = search;
  return url;
}
