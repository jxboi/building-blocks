export type ProblemDetails = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly type?: string;
  readonly correlationId?: string;
  readonly fieldErrors: Record<string, string[]>;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.type = problem.type;
    this.correlationId = problem.correlationId;
    this.fieldErrors = problem.errors ?? {};
  }
}

export async function toApiError(response: Response) {
  const correlationId = response.headers.get("x-correlation-id") ?? undefined;
  try {
    const body = (await response.json()) as Partial<ProblemDetails>;
    return new ApiError({
      title: body.title ?? "Request failed",
      status: body.status ?? response.status,
      detail: body.detail,
      type: body.type,
      instance: body.instance,
      correlationId: body.correlationId ?? correlationId,
      errors: body.errors,
    });
  } catch {
    return new ApiError({
      title: "Request failed",
      status: response.status,
      detail: "The service returned an unreadable error response.",
      correlationId,
    });
  }
}
