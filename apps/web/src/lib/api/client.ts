import type { paths } from "@/lib/api/schema";
import { toApiError } from "@/lib/api/api-error";

export type ApiPath = keyof paths;

export async function apiRequest<ResponseBody>(
  path: ApiPath,
  init: RequestInit = {},
): Promise<ResponseBody> {
  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as ResponseBody;
  return (await response.json()) as ResponseBody;
}
