import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateRandomPassword,
} from "./auth";

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
});

describe("validatePasswordStrength", () => {
  it("accepts an 8+ char password containing a letter and a number", () => {
    expect(validatePasswordStrength("abcd1234")).toBeNull();
  });

  it("rejects passwords under 8 characters", () => {
    expect(validatePasswordStrength("ab1")).toMatch(/at least 8/);
  });

  it("rejects passwords with no digit", () => {
    expect(validatePasswordStrength("abcdefgh")).toMatch(/number/);
  });

  it("rejects passwords with no letter", () => {
    expect(validatePasswordStrength("12345678")).toMatch(/letter/);
  });
});

describe("generateRandomPassword", () => {
  it("generates a password of the requested length", () => {
    expect(generateRandomPassword(12)).toHaveLength(12);
  });

  it("defaults to length 10 and always includes at least one letter and one digit", () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generateRandomPassword();
      expect(pwd).toHaveLength(10);
      expect(pwd).toMatch(/[A-Za-z]/);
      expect(pwd).toMatch(/[0-9]/);
    }
  });

  it("avoids visually ambiguous characters (0, O, 1, l, I)", () => {
    for (let i = 0; i < 30; i++) {
      const pwd = generateRandomPassword(20);
      expect(pwd).not.toMatch(/[01IOlo]/);
    }
  });
});
