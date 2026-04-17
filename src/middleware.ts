import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);

type Role = "student" | "teacher" | "admin";

function dashboardHome(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher/dashboard";
  return "/student/dashboard";
}

async function verifyTokenEdge(
  token: string
): Promise<{ userId: string; role: Role; studentId?: string; teacherId?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      studentId: payload.studentId as string | undefined,
      teacherId: payload.teacherId as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/setup-initial-data") ||
    pathname.startsWith("/api/debug-users")
  ) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/root
  if (pathname === "/" || pathname === "/login") {
    const token = request.cookies.get("token")?.value;
    if (token) {
      const payload = await verifyTokenEdge(token);
      if (payload) {
        return NextResponse.redirect(new URL(dashboardHome(payload.role), request.url));
      }
    }
    return NextResponse.next();
  }

  // Protect all /student routes (student role only)
  if (pathname.startsWith("/student")) {
    const token = request.cookies.get("token")?.value;
    const payload = token ? await verifyTokenEdge(token) : null;

    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (payload.role !== "student") {
      return NextResponse.redirect(new URL(dashboardHome(payload.role), request.url));
    }

    return NextResponse.next();
  }

  // Protect all /admin routes (admin role only)
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("token")?.value;
    const payload = token ? await verifyTokenEdge(token) : null;

    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL(dashboardHome(payload.role), request.url));
    }

    return NextResponse.next();
  }

  // Protect all /teacher routes (teacher role only)
  if (pathname.startsWith("/teacher")) {
    const token = request.cookies.get("token")?.value;
    const payload = token ? await verifyTokenEdge(token) : null;

    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (payload.role !== "teacher") {
      return NextResponse.redirect(new URL(dashboardHome(payload.role), request.url));
    }

    return NextResponse.next();
  }

  // Protect all /dashboard routes (legacy — redirect to role home)
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("token")?.value;
    const payload = token ? await verifyTokenEdge(token) : null;

    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.redirect(new URL(dashboardHome(payload.role), request.url));
  }

  // Protect all /api routes (except login, handled above)
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
  matcher: ["/", "/login", "/dashboard/:path*", "/admin/:path*", "/student/:path*", "/teacher/:path*", "/api/:path*"],
};
