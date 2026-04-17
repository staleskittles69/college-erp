import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
