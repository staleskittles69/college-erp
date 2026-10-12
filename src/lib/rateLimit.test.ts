import { describe, it, expect } from "vitest";
import { LOGIN_LIMITS, loginBuckets, retryAfterMs } from "./rateLimit";

const NOW = 1_000_000_000_000;
const ACCOUNT = "25cse00001@college.edu";
const buckets = loginBuckets("1.2.3.4", ACCOUNT);

function doc(key: string, count: number, msLeft: number) {
  return { key, count, expiresAt: new Date(NOW + msLeft) };
}

describe("retryAfterMs", () => {
  it("allows a login when there are no failures", () => {
    expect(retryAfterMs(buckets, [], NOW)).toBe(0);
  });

  it("allows a login while every counter is under its limit", () => {
    const docs = [
      doc("ip:1.2.3.4", LOGIN_LIMITS.ip - 1, 60_000),
      doc(`acct:${ACCOUNT}`, LOGIN_LIMITS.account - 1, 60_000),
      doc(`ipacct:1.2.3.4|${ACCOUNT}`, LOGIN_LIMITS.ipAccount - 1, 60_000),
    ];
    expect(retryAfterMs(buckets, docs, NOW)).toBe(0);
  });

  it("blocks once the ip+account counter hits its limit", () => {
    const docs = [doc(`ipacct:1.2.3.4|${ACCOUNT}`, LOGIN_LIMITS.ipAccount, 90_000)];
    expect(retryAfterMs(buckets, docs, NOW)).toBe(90_000);
  });

  it("blocks a password-spraying IP even on an account it has not tried yet", () => {
    const docs = [doc("ip:1.2.3.4", LOGIN_LIMITS.ip, 30_000)];
    const otherAccount = loginBuckets("1.2.3.4", "25cse00002@college.edu");
    expect(retryAfterMs(otherAccount, docs, NOW)).toBe(30_000);
  });

  it("does not block the real owner on another IP after one attacker IP is blocked", () => {
    const docs = [
      doc(`ipacct:1.2.3.4|${ACCOUNT}`, LOGIN_LIMITS.ipAccount, 90_000),
      doc(`acct:${ACCOUNT}`, LOGIN_LIMITS.ipAccount, 90_000),
    ];
    const fromHome = loginBuckets("9.9.9.9", ACCOUNT);
    expect(retryAfterMs(fromHome, docs, NOW)).toBe(0);
  });

  it("returns the longest wait when several limits are hit", () => {
    const docs = [doc("ip:1.2.3.4", LOGIN_LIMITS.ip, 10_000), doc(`acct:${ACCOUNT}`, LOGIN_LIMITS.account, 50_000)];
    expect(retryAfterMs(buckets, docs, NOW)).toBe(50_000);
  });

  it("ignores counters whose window has already ended", () => {
    const docs = [doc("ip:1.2.3.4", LOGIN_LIMITS.ip + 5, -1)];
    expect(retryAfterMs(buckets, docs, NOW)).toBe(0);
  });
});
