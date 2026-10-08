import { describe, it, expect } from "vitest";
import { canModifyOwned } from "./ownership";
import { JwtPayload } from "./auth";

const admin = { userId: "a1", role: "admin" } as JwtPayload;
const teacher = { userId: "t1", role: "teacher" } as JwtPayload;
const student = { userId: "s1", role: "student" } as JwtPayload;

describe("canModifyOwned", () => {
  it("lets an admin modify anything, including unowned records", () => {
    expect(canModifyOwned(admin, "t1")).toBe(true);
    expect(canModifyOwned(admin, null)).toBe(true);
  });

  it("lets a teacher modify only their own records", () => {
    expect(canModifyOwned(teacher, "t1")).toBe(true);
    expect(canModifyOwned(teacher, "t2")).toBe(false);
  });

  it("keeps unowned records admin-only", () => {
    expect(canModifyOwned(teacher, null)).toBe(false);
    expect(canModifyOwned(teacher, undefined)).toBe(false);
  });

  it("never lets a student modify anything", () => {
    expect(canModifyOwned(student, "s1")).toBe(false);
  });
});
