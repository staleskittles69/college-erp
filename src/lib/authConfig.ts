// Auth settings shared by the Node API routes and the Edge middleware.
// Keep this file free of Node-only imports (no mongoose, bcrypt, crypto).

export type Role = "student" | "teacher" | "admin";

export const ROLES: readonly Role[] = ["student", "teacher", "admin"];

// The __Host- prefix makes the browser refuse the cookie unless it's Secure, path=/ and
// has no Domain — so no other subdomain can plant or overwrite it. It needs HTTPS, so
// plain "token" is used in local dev.
export const AUTH_COOKIE = process.env.NODE_ENV === "production" ? "__Host-token" : "token";

export const JWT_ISSUER = "college-erp";
export const JWT_AUDIENCE = "college-erp-web";
export const JWT_ALGORITHM = "HS256";

// How long a login lasts before you have to sign in again.
export const SESSION_TTL_SECONDS: Record<Role, number> = {
  admin: 8 * 60 * 60,
  teacher: 24 * 60 * 60,
  student: 24 * 60 * 60,
};

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: maxAgeSeconds,
    path: "/",
  };
}

// APIs a user may still call while they're being made to pick a new password.
export const PASSWORD_CHANGE_ALLOWED_APIS = [
  "/api/auth/change-password",
  "/api/auth/logout",
  "/api/auth/me",
];

export const CHANGE_PASSWORD_PATH = "/change-password";
