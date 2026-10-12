import { NextRequest } from "next/server";
import LoginAttempt from "@/models/LoginAttempt";

// Three counters of failed logins, each over a 15-minute window:
//  - ip:          stops one computer spraying a common password across many accounts
//  - account:     stops many computers slowly guessing one account's password
//  - ip+account:  trips first, so a single attacker gets blocked long before they could
//                 lock the real owner out (the account counter stops counting once they're blocked)
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const LOGIN_LIMITS = {
  ip: 20,
  account: 10,
  ipAccount: 5,
} as const;

export type BucketName = keyof typeof LOGIN_LIMITS;

export interface Bucket {
  name: BucketName;
  key: string;
}

export function loginBuckets(ip: string, identifier: string): Bucket[] {
  return [
    { name: "ip", key: `ip:${ip}` },
    { name: "account", key: `acct:${identifier}` },
    { name: "ipAccount", key: `ipacct:${ip}|${identifier}` },
  ];
}

interface CounterDoc {
  key: string;
  count: number;
  expiresAt: Date;
}

/**
 * Given the stored counters, returns how many ms until the caller may try again,
 * or 0 if no limit is hit. Pure — exported for tests.
 */
export function retryAfterMs(buckets: Bucket[], docs: CounterDoc[], now: number): number {
  let wait = 0;
  for (const bucket of buckets) {
    const doc = docs.find((d) => d.key === bucket.key);
    if (!doc || doc.expiresAt.getTime() <= now) continue;
    if (doc.count >= LOGIN_LIMITS[bucket.name]) {
      wait = Math.max(wait, doc.expiresAt.getTime() - now);
    }
  }
  return wait;
}

export function clientIp(request: NextRequest): string {
  // request.ip is set by Vercel. x-forwarded-for is the fallback (Vercel overwrites it
  // with the real client address, so it can't be spoofed there).
  const fromPlatform = (request as NextRequest & { ip?: string }).ip;
  if (fromPlatform) return fromPlatform;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Callers must have already run connectDB().
export async function checkLoginRateLimit(buckets: Bucket[]): Promise<number> {
  const docs = await LoginAttempt.find({ key: { $in: buckets.map((b) => b.key) } }).lean<CounterDoc[]>();
  return retryAfterMs(buckets, docs, Date.now());
}

async function increment(key: string): Promise<void> {
  const now = new Date();
  // MongoDB's TTL cleanup runs about once a minute, so an expired counter can still be
  // sitting there — clear it so this failure starts a fresh window.
  await LoginAttempt.deleteOne({ key, expiresAt: { $lte: now } });
  try {
    await LoginAttempt.updateOne(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + LOGIN_WINDOW_MS) } },
      { upsert: true }
    );
  } catch (error) {
    // Two failures racing to create the same counter: one wins, retry as a plain increment.
    if ((error as { code?: number }).code === 11000) {
      await LoginAttempt.updateOne({ key }, { $inc: { count: 1 } });
    } else {
      throw error;
    }
  }
}

export async function recordLoginFailure(buckets: Bucket[]): Promise<void> {
  await Promise.all(buckets.map((bucket) => increment(bucket.key)));
}

// After a correct password, forget this account's failures. The per-IP counter is kept,
// otherwise an attacker could reset it by logging into their own account between guesses.
export async function clearLoginFailures(buckets: Bucket[]): Promise<void> {
  const keys = buckets.filter((b) => b.name !== "ip").map((b) => b.key);
  await LoginAttempt.deleteMany({ key: { $in: keys } });
}
