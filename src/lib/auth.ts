import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JWT_ALGORITHM, JWT_AUDIENCE, JWT_ISSUER, ROLES, Role } from "./authConfig";

export type JwtPayload = {
  userId: string;
  role: Role;
  // Session id — the login is only valid while this Session document exists.
  sid: string;
  // Set while the user must pick a new password before using the portal.
  pwc?: boolean;
};

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not set");
}

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// True when a stored hash was made with fewer rounds than we use now, so it should be
// re-hashed the next time we have the plain password (i.e. on a successful login).
export function needsRehash(hashed: string): boolean {
  try {
    return bcrypt.getRounds(hashed) < BCRYPT_ROUNDS;
  } catch {
    return true;
  }
}

let dummyHash: Promise<string> | null = null;

// Run a real bcrypt compare even when the account doesn't exist, so the response
// takes the same time and can't be used to discover which roll numbers/emails exist.
export async function compareAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(crypto.randomBytes(16).toString("hex"));
  await bcrypt.compare(password, await dummyHash);
  return false;
}

export function signToken(payload: JwtPayload, expiresInSeconds: number): string {
  const claims: JwtPayload = { userId: payload.userId, role: payload.role, sid: payload.sid };
  if (payload.pwc) claims.pwc = true;
  return jwt.sign(claims, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: expiresInSeconds,
  });
}

export function isJwtPayload(value: unknown): value is JwtPayload {
  if (!value || typeof value !== "object") return false;
  const claims = value as Record<string, unknown>;
  return (
    typeof claims.userId === "string" &&
    /^[a-f0-9]{24}$/i.test(claims.userId) &&
    typeof claims.sid === "string" &&
    claims.sid.length > 0 &&
    typeof claims.role === "string" &&
    (ROLES as readonly string[]).includes(claims.role) &&
    (claims.pwc === undefined || typeof claims.pwc === "boolean")
  );
}

// Checks the signature, algorithm, issuer, audience, expiry and shape. Does NOT check
// that the session still exists — use getAuth() in API routes for that.
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (!isJwtPayload(decoded)) return null;
    const { userId, role, sid, pwc } = decoded;
    return pwc ? { userId, role, sid, pwc } : { userId, role, sid };
  } catch {
    return null;
  }
}

export { validatePasswordStrength } from "./passwordRules";

const PASSWORD_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const PASSWORD_DIGITS = "23456789";
const PASSWORD_ALL = PASSWORD_LETTERS + PASSWORD_DIGITS;

export function generateRandomPassword(length = 12): string {
  const pick = (charset: string) => charset[crypto.randomInt(charset.length)];
  const chars = [pick(PASSWORD_LETTERS), pick(PASSWORD_DIGITS)];
  for (let i = chars.length; i < length; i++) chars.push(pick(PASSWORD_ALL));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
