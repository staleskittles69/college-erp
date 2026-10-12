import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "./passwordRules";

describe("validatePasswordStrength — common passwords", () => {
  it.each([
    "student123",
    "Student2025",
    "teacher1234",
    "admin12345",
    "Password@1",
    "password12",
    "college2025",
    "qwerty1234",
    "1234567890a",
  ])("refuses %s", (password) => {
    expect(validatePasswordStrength(password)).not.toBeNull();
  });

  it("refuses very repetitive passwords", () => {
    expect(validatePasswordStrength("aaaa1111aa")).toMatch(/repetitive/);
  });

  it("allows an ordinary strong password", () => {
    expect(validatePasswordStrength("blue7Tiger!lamp")).toBeNull();
  });
});

describe("validatePasswordStrength — personal details", () => {
  it("refuses a password containing the roll number", () => {
    expect(validatePasswordStrength("x25cse00001y", ["25cse00001@college.edu"])).toMatch(/roll number/);
  });

  it("refuses a password containing part of the name, ignoring case", () => {
    expect(validatePasswordStrength("Ramesh2025xyz", ["drrameshiyer.cse@college.edu", "Ramesh Iyer"])).not.toBeNull();
  });

  it("ignores very short name parts", () => {
    expect(validatePasswordStrength("blue7Tiger!lamp", ["Al Bo"])).toBeNull();
  });
});
