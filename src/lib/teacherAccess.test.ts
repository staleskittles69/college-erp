import { describe, it, expect } from "vitest";
import { canTargetClass } from "./teacherAccess";

const teaching = [
  { branch: "CSE", year: 2, sections: ["Section 1", "Section 2"] },
  { branch: "ECE", year: 3, sections: ["Section 1"] },
];

describe("canTargetClass", () => {
  it("allows the teacher's own branch, year and section", () => {
    expect(canTargetClass(teaching, { branch: "CSE", year: 2, section: "Section 2" })).toBe(true);
    expect(canTargetClass(teaching, { branch: "CSE", year: 2 })).toBe(true);
  });

  it("allows every year of a branch they teach, and the whole college", () => {
    expect(canTargetClass(teaching, { branch: "ECE" })).toBe(true);
    expect(canTargetClass(teaching, {})).toBe(true);
    expect(canTargetClass(teaching, { branch: null, year: null, section: null })).toBe(true);
  });

  it("rejects a branch, year or section they don't teach", () => {
    expect(canTargetClass(teaching, { branch: "ME" })).toBe(false);
    expect(canTargetClass(teaching, { branch: "CSE", year: 3 })).toBe(false);
    expect(canTargetClass(teaching, { branch: "ECE", year: 3, section: "Section 2" })).toBe(false);
  });

  it("rejects a year or section without a branch, and a section without a year", () => {
    expect(canTargetClass(teaching, { year: 2 })).toBe(false);
    expect(canTargetClass(teaching, { section: "Section 1" })).toBe(false);
    expect(canTargetClass(teaching, { branch: "CSE", section: "Section 1" })).toBe(false);
  });

  it("rejects everything specific for a teacher with no classes", () => {
    expect(canTargetClass([], { branch: "CSE", year: 2 })).toBe(false);
  });
});
