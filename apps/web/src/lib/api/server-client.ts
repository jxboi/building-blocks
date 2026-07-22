import "server-only";

import type { paths } from "@/lib/api/schema";
import { toApiError } from "@/lib/api/api-error";

export async function serverApiRequest<ResponseBody>(
  path: keyof paths,
  accessToken: string,
  init: RequestInit = {},
): Promise<ResponseBody> {
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:5000";
  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as ResponseBody;
}
