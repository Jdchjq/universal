import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

const publicPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/music",
  "/api/film",
  "/api/artists",
  "/api/comments",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (publicPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { code: 1, data: null, message: "请先登录" },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      const headers = new Headers(request.headers);
      headers.set("x-user-id", payload.userId as string);
      headers.set("x-user-role", payload.role as string);
      return NextResponse.next({ headers });
    } catch {
      return NextResponse.json(
        { code: 1, data: null, message: "登录已过期，请重新登录" },
        { status: 401 }
      );
    }
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
