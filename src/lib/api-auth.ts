import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/auth";

export function getToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("token");
  if (cookie?.value) return cookie.value;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getAuth(request: NextRequest): Promise<JwtPayload | null> {
  const token = getToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAdmin(payload: JwtPayload | null): boolean {
  return payload?.role === "admin";
}

export function requireTeacher(payload: JwtPayload | null): boolean {
  return payload?.role === "teacher";
}

export function requireAdminOrTeacher(payload: JwtPayload | null): boolean {
  return payload?.role === "admin" || payload?.role === "teacher";
}
