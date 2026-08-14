import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export type JwtPayload = {
  userId: string;
  role: "student" | "teacher" | "admin";
  studentId?: string;
  teacherId?: string;
  rollNumber?: number;
};

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "1d") as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not set");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export { validatePasswordStrength } from "./passwordRules";

const PASSWORD_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const PASSWORD_DIGITS = "23456789";
const PASSWORD_ALL = PASSWORD_LETTERS + PASSWORD_DIGITS;

export function generateRandomPassword(length = 10): string {
  const pick = (charset: string) => charset[crypto.randomInt(charset.length)];
  const chars = [pick(PASSWORD_LETTERS), pick(PASSWORD_DIGITS)];
  for (let i = chars.length; i < length; i++) chars.push(pick(PASSWORD_ALL));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
