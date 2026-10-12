import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import Session from "@/models/Session";
import { signToken } from "@/lib/auth";
import { AUTH_COOKIE, Role, SESSION_TTL_SECONDS, authCookieOptions } from "@/lib/authConfig";
import { clientIp } from "@/lib/rateLimit";

// Callers must have already run connectDB() before using anything in this file.

interface SessionUser {
  _id: { toString(): string };
  role: Role;
  mustChangePassword?: boolean;
}

/** Creates a Session, signs a token for it and sets the login cookie on `response`. Returns the token. */
export async function startSession(
  user: SessionUser,
  request: NextRequest,
  response: NextResponse
): Promise<string> {
  const ttl = SESSION_TTL_SECONDS[user.role];
  const sid = crypto.randomBytes(32).toString("base64url");
  const now = new Date();

  await Session.create({
    _id: sid,
    userId: user._id,
    role: user.role,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    lastSeenAt: now,
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? undefined,
  });

  const token = signToken(
    { userId: user._id.toString(), role: user.role, sid, pwc: Boolean(user.mustChangePassword) },
    ttl
  );
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions(ttl));
  return token;
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE, "", { ...authCookieOptions(0), expires: new Date(0) });
  // Older logins used a cookie simply called "token" — clear that too.
  if (AUTH_COOKIE !== "token") response.cookies.set("token", "", { path: "/", maxAge: 0, expires: new Date(0) });
}

export async function endSession(sid: string): Promise<void> {
  await Session.deleteOne({ _id: sid });
}

/** Logs a user out everywhere, optionally keeping one session (the one making the request). */
export async function endAllSessions(userId: string, exceptSid?: string): Promise<number> {
  const filter: Record<string, unknown> = { userId };
  if (exceptSid) filter._id = { $ne: exceptSid };
  const result = await Session.deleteMany(filter);
  return result.deletedCount ?? 0;
}
