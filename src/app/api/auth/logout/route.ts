import { NextResponse } from "next/server";
import { clearTokenCookie } from "@/lib/auth";

export async function POST() {
  const cookie = clearTokenCookie();
  const response = NextResponse.json({
    code: 0,
    data: null,
    message: "已退出",
  });
  response.cookies.set(cookie);
  return response;
}
