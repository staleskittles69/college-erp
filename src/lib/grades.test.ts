import { describe, it, expect } from "vitest";
import { calcGrade, gradePoint, computeCGPA } from "./grades";

describe("calcGrade", () => {
  it.each([
    [95, "A+"],
    [85, "A"],
    [75, "B+"],
    [65, "B"],
    [55, "C+"],
    [45, "C"],
    [30, "D"],
  ])("marks of %i/100 grades as %s", (obtained, expected) => {
    expect(calcGrade(obtained, 100)).toBe(expected);
  });

  it("scales by max marks, not just the raw obtained number", () => {
    expect(calcGrade(45, 50)).toBe("A+"); // 90%
  });
});

describe("gradePoint", () => {
  it("maps percentage bands to grade points between 4 and 10", () => {
    expect(gradePoint(95)).toBe(10);
    expect(gradePoint(40)).toBe(5);
    expect(gradePoint(10)).toBe(4);
  });
});

describe("computeCGPA", () => {
  it("returns null when there are no records", () => {
    expect(computeCGPA([])).toBeNull();
  });

  it("sums marks within a subject, then averages grade points across subjects", () => {
    const records = [
      { subject: "Math", obtained: 45, max: 50 }, // combined 90/100 -> 10
      { subject: "Math", obtained: 45, max: 50 },
      { subject: "Physics", obtained: 30, max: 50 }, // 60% -> 7
    ];
    expect(computeCGPA(records)).toBeCloseTo((10 + 7) / 2);
  });
});
