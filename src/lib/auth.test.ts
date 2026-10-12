import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  hashPassword,
  comparePassword,
  needsRehash,
  validatePasswordStrength,
  generateRandomPassword,
  signToken,
  verifyToken,
} from "./auth";

const SECRET = "test-secret-not-used-in-production";
const USER_ID = "64b000000000000000000001";
const SIGN_OPTS = { issuer: "college-erp", audience: "college-erp-web" };

describe("hashPassword / comparePassword", () => {
  it("hashes a password and verifies it round-trips", async () => {
    const hash = await hashPassword("student123");
    expect(hash).not.toBe("student123");
    expect(await comparePassword("student123", hash)).toBe(true);
  });

  it("rejects the wrong password against a valid hash", async () => {
    const hash = await hashPassword("student123");
    expect(await comparePassword("wrong-password", hash)).toBe(false);
  });

  it("flags hashes made with fewer than 12 rounds for re-hashing", async () => {
    expect(needsRehash(await bcrypt.hash("x", 10))).toBe(true);
    expect(needsRehash(await hashPassword("x"))).toBe(false);
  });
});

describe("validatePasswordStrength", () => {
  it("accepts a 10+ char password containing a letter and a number", () => {
    expect(validatePasswordStrength("mango7river")).toBeNull();
  });

  it("rejects passwords under 10 characters", () => {
    expect(validatePasswordStrength("mango7riv")).toMatch(/at least 10/);
  });

  it("rejects passwords with no digit", () => {
    expect(validatePasswordStrength("mangoriverbank")).toMatch(/number/);
  });

  it("rejects passwords with no letter", () => {
    expect(validatePasswordStrength("1234567890")).toMatch(/letter/);
  });
});

describe("generateRandomPassword", () => {
  it("generates a password of the requested length", () => {
    expect(generateRandomPassword(14)).toHaveLength(14);
  });

  it("defaults to length 12, includes a letter and a digit, and passes the password rules", () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generateRandomPassword();
      expect(pwd).toHaveLength(12);
      expect(pwd).toMatch(/[A-Za-z]/);
      expect(pwd).toMatch(/[0-9]/);
      expect(validatePasswordStrength(pwd)).toBeNull();
    }
  });

  it("avoids visually ambiguous characters (0, O, 1, l, I)", () => {
    for (let i = 0; i < 30; i++) {
      const pwd = generateRandomPassword(20);
      expect(pwd).not.toMatch(/[01IOlo]/);
    }
  });
});

describe("signToken / verifyToken", () => {
  const claims = { userId: USER_ID, role: "student" as const, sid: "session-abc" };

  it("round-trips a token", () => {
    expect(verifyToken(signToken(claims, 60))).toEqual(claims);
  });

  it("keeps the must-change-password flag", () => {
    expect(verifyToken(signToken({ ...claims, pwc: true }, 60))).toEqual({ ...claims, pwc: true });
  });

  it("rejects a token signed with a different secret", () => {
    expect(verifyToken(jwt.sign(claims, "some-other-secret", SIGN_OPTS))).toBeNull();
  });

  it("rejects an unsigned (alg: none) token", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({ ...claims, role: "admin", iss: "college-erp", aud: "college-erp-web" })
    ).toString("base64url");
    expect(verifyToken(`${header}.${body}.`)).toBeNull();
  });

  it("rejects the wrong audience or issuer", () => {
    expect(verifyToken(jwt.sign(claims, SECRET, { issuer: "college-erp", audience: "other-app" }))).toBeNull();
    expect(verifyToken(jwt.sign(claims, SECRET, { issuer: "someone-else", audience: "college-erp-web" }))).toBeNull();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 10 }, SECRET, SIGN_OPTS);
    expect(verifyToken(expired)).toBeNull();
  });

  it("rejects old-style tokens with no session id, unknown roles and bad user ids", () => {
    expect(verifyToken(jwt.sign({ userId: USER_ID, role: "admin" }, SECRET, SIGN_OPTS))).toBeNull();
    expect(verifyToken(jwt.sign({ ...claims, role: "superuser" }, SECRET, SIGN_OPTS))).toBeNull();
    expect(verifyToken(jwt.sign({ ...claims, userId: "not-an-id" }, SECRET, SIGN_OPTS))).toBeNull();
  });
});
