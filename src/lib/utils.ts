import { ApiResponse } from "@/types";

export function success<T>(data: T, message = "ok"): Response {
  return Response.json({ code: 0, data, message } satisfies ApiResponse<T>);
}

export function error(message: string, code = 1, status = 400): Response {
  return Response.json({ code, data: null, message } satisfies ApiResponse, {
    status,
  });
}
