import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
import User from "@/models/User";
import { verifyToken, JwtPayload } from "@/lib/auth";
import { AUTH_COOKIE, Role } from "@/lib/authConfig";

// lastSeenAt is only refreshed this often, so normal browsing doesn't write on every request.
const LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;

export function getToken(request: NextRequest): string | null {
  const tokenCookie = request.cookies.get(AUTH_COOKIE);
  if (tokenCookie?.value) return tokenCookie.value;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

interface SessionDoc {
  _id: string;
  userId: { toString(): string };
  expiresAt: Date;
  lastSeenAt: Date;
}

interface UserDoc {
  role: Role;
  mustChangePassword?: boolean;
}

/**
 * Returns who is making the request, or null if they aren't logged in.
 *
 * Besides checking the token's signature it confirms, in the database, that the login
 * (Session) hasn't been ended by logout / a password change, and that the user still
 * exists. The role returned is the user's current role from the database.
 *
 * Users who must change their password get null everywhere except the few routes that
 * pass `allowPendingPasswordChange` (change-password, logout, me).
 */
export async function getAuth(
  request: NextRequest,
  options: { allowPendingPasswordChange?: boolean } = {}
): Promise<JwtPayload | null> {
  const token = getToken(request);
  if (!token) return null;
  const claims = verifyToken(token);
  if (!claims) return null;

  try {
    await connectDB();
    const [session, user] = await Promise.all([
      Session.findById(claims.sid).lean<SessionDoc>(),
      User.findById(claims.userId).select("role mustChangePassword").lean<UserDoc>(),
    ]);

    const now = Date.now();
    if (!session || !user) return null;
    if (session.userId.toString() !== claims.userId) return null;
    if (session.expiresAt.getTime() <= now) return null;
    if (user.mustChangePassword && !options.allowPendingPasswordChange) return null;

    if (now - session.lastSeenAt.getTime() > LAST_SEEN_REFRESH_MS) {
      Session.updateOne({ _id: claims.sid }, { lastSeenAt: new Date(now) }).catch(() => {});
    }

    const result: JwtPayload = { userId: claims.userId, role: user.role, sid: claims.sid };
    if (user.mustChangePassword) result.pwc = true;
    return result;
  } catch (error) {
    console.error("getAuth session check failed:", error);
    return null;
  }
}

export function requireAdmin(payload: JwtPayload | null): boolean {
  return payload?.role === "admin";
}

export function requireAdminOrTeacher(payload: JwtPayload | null): boolean {
  return payload?.role === "admin" || payload?.role === "teacher";
}
