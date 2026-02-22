// This file replaces the deprecated middleware.ts for Next.js 16+.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);

async function verifyTokenEdge(token: string): Promise<{ userId: string; role: string; studentId?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      role: payload.role as string,
      studentId: payload.studentId as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  if (pathname === "/" || pathname === "/login") {
    const token = request.cookies.get("token")?.value;
    if (token) {
      const payload = await verifyTokenEdge(token);
      if (payload) {
        const redirectUrl = payload.role === "admin" ? "/dashboard/admin" : "/dashboard/student";
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("token")?.value;
    const payload = token ? await verifyTokenEdge(token) : null;

    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/student", request.url));
    }

    if (pathname.startsWith("/dashboard/student") && payload.role !== "student") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const token =
      request.cookies.get("token")?.value ??
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyTokenEdge(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/api/:path*"],
};
