import type { NextRequest } from "next/server";

export function getRequestId(request: NextRequest) {
  const headerValue = request.headers.get("x-request-id");
  return headerValue?.trim() || crypto.randomUUID();
}
