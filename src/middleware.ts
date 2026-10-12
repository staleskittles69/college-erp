import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  AUTH_COOKIE,
  CHANGE_PASSWORD_PATH,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  PASSWORD_CHANGE_ALLOWED_APIS,
  ROLES,
  Role,
} from "@/lib/authConfig";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not set");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface TokenClaims {
  userId: string;
  role: Role;
  mustChangePassword: boolean;
}

function dashboardHome(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teachers";
  return "/student";
}

// Middleware runs on the Edge, where the database isn't available, so this only checks
// the token's signature/expiry. Every API route additionally checks the session in the
// database via getAuth(), which is what makes logout and password changes take effect.
async function verifyTokenEdge(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const { userId, role, sid, pwc } = payload as Record<string, unknown>;
    if (typeof userId !== "string" || typeof sid !== "string" || !sid) return null;
    if (typeof role !== "string" || !(ROLES as readonly string[]).includes(role)) return null;
    return { userId, role: role as Role, mustChangePassword: pwc === true };
  } catch {
    return null;
  }
}

async function readToken(request: NextRequest): Promise<TokenClaims | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  return token ? verifyTokenEdge(token) : null;
}

// Blocks other websites from making a logged-in user's browser change things here
// (cross-site request forgery). Browsers always send Origin on these requests.
function isCrossSiteWrite(request: NextRequest): boolean {
  if (!STATE_CHANGING_METHODS.has(request.method)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (origin === "null") return true;
  try {
    return new URL(origin).host !== request.headers.get("host");
  } catch {
    return true;
  }
}

function protectPortal(claims: TokenClaims | null, request: NextRequest, role: Role) {
  if (!claims) return NextResponse.redirect(new URL("/login", request.url));
  if (claims.mustChangePassword) return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url));
  if (claims.role !== role) return NextResponse.redirect(new URL(dashboardHome(claims.role), request.url));
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") && isCrossSiteWrite(request)) {
    return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  }

  if (pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  // Redirect logged-in users away from root only; /login always stays accessible so users can switch accounts
  if (pathname === "/") {
    const claims = await readToken(request);
    if (claims) {
      const target = claims.mustChangePassword ? CHANGE_PASSWORD_PATH : dashboardHome(claims.role);
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === CHANGE_PASSWORD_PATH) {
    const claims = await readToken(request);
    if (!claims) return NextResponse.redirect(new URL("/login", request.url));
    if (!claims.mustChangePassword) return NextResponse.redirect(new URL(dashboardHome(claims.role), request.url));
    return NextResponse.next();
  }

  // /student/*, /admin/*, /teacher(s)/*: role-only portals
  if (pathname.startsWith("/student")) return protectPortal(await readToken(request), request, "student");
  if (pathname.startsWith("/admin")) return protectPortal(await readToken(request), request, "admin");
  if (pathname.startsWith("/teacher")) return protectPortal(await readToken(request), request, "teacher");

  // Protect all /dashboard routes (legacy — redirect to role home)
  if (pathname.startsWith("/dashboard")) {
    const claims = await readToken(request);
    if (!claims) return NextResponse.redirect(new URL("/login", request.url));
    const target = claims.mustChangePassword ? CHANGE_PASSWORD_PATH : dashboardHome(claims.role);
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Protect all /api routes (except login, handled above)
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    const token =
      request.cookies.get(AUTH_COOKIE)?.value ??
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined);
    const claims = token ? await verifyTokenEdge(token) : null;
    if (!claims) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (claims.mustChangePassword && !PASSWORD_CHANGE_ALLOWED_APIS.includes(pathname)) {
      return NextResponse.json(
        { error: "You must change your password first", mustChangePassword: true },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/change-password", "/dashboard/:path*", "/admin/:path*", "/student/:path*", "/teacher/:path*", "/teachers/:path*", "/teachers", "/api/:path*"],
};
