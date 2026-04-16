import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "IMPORT_ERROR"
  | "INTERNAL_ERROR";

export function apiSuccess<T>(
  requestId: string,
  data: T,
  init?: { status?: number }
) {
  return NextResponse.json(
    {
      success: true,
      requestId,
      data,
    },
    { status: init?.status ?? 200 }
  );
}

export function apiError(
  requestId: string,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      requestId,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}
