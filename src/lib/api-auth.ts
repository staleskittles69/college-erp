import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/auth";
import User from "@/models/User";

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

// Suggestions are private to one admin login. The JWT has no email, so look the user up.
const SUGGESTIONS_OWNER_EMAIL = "manish@college.edu";

export async function isSuggestionsOwner(payload: JwtPayload | null): Promise<boolean> {
  if (!payload || payload.role !== "admin") return false;
  const user = await User.findById(payload.userId).select("email").lean<{ email?: string }>();
  const owner = (process.env.SUGGESTIONS_OWNER_EMAIL ?? SUGGESTIONS_OWNER_EMAIL).toLowerCase();
  return user?.email?.toLowerCase() === owner;
}
