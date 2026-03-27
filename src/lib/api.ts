export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return jsonResponse({ error: error.message }, error.statusCode);
  }

  console.error(error);

  return jsonResponse({ error: "Internal server error" }, 500);
}
