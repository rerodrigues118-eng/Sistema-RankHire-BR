import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(message: string, public readonly status = 500) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown, fallback = "Erro interno do servidor") {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Response) {
    return error;
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function getJsonBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}
