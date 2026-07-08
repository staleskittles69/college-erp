import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/auth";

export function getToken(request: NextRequest): string | null {
  const tokenCookie = request.cookies.get("token");
  if (tokenCookie?.value) return tokenCookie.value;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
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

export function requireStudent(payload: JwtPayload | null): boolean {
  return payload?.role === "student" || payload?.role === "admin";
}
