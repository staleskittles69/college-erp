import { describe, it, expect } from "vitest";
import { yearLabel, isAssignmentType, studentDetailUrl } from "./academics";

describe("yearLabel", () => {
  it("returns ordinal labels for known years", () => {
    expect(yearLabel(1)).toBe("1st Year");
    expect(yearLabel(2)).toBe("2nd Year");
    expect(yearLabel(3)).toBe("3rd Year");
    expect(yearLabel(4)).toBe("4th Year");
  });

  it("accepts numeric strings, since API responses often send year as a string", () => {
    expect(yearLabel("2")).toBe("2nd Year");
  });

  it("falls back to an Nth suffix for unknown years", () => {
    expect(yearLabel(5)).toBe("5th Year");
  });
});

describe("isAssignmentType", () => {
  it("matches case-insensitively", () => {
    expect(isAssignmentType("Assignment Test")).toBe(true);
    expect(isAssignmentType("ASSIGNMENT")).toBe(true);
  });

  it("returns false for other test types and empty input", () => {
    expect(isAssignmentType("Unit Test")).toBe(false);
    expect(isAssignmentType(undefined)).toBe(false);
    expect(isAssignmentType(null)).toBe(false);
  });
});

describe("studentDetailUrl", () => {
  // Regression guard: section/year format mismatches between User and Timetable
  // models have broken this URL before (see PROJECT_CONTEXT.md, Jul 24 fixes).
  it("builds a lowercase, hyphenated URL matching the admin route structure", () => {
    const url = studentDetailUrl({
      _id: "abc123",
      branch: "CSE",
      year: 2,
      section: "Section 1",
    });
    expect(url).toBe("/admin/cse/2nd-year/section-1/abc123");
  });

  it("falls back to 1st-year for an out-of-range year instead of throwing", () => {
    const url = studentDetailUrl({ _id: "x", branch: "ME", year: 9, section: "A" });
    expect(url).toBe("/admin/me/1st-year/a/x");
  });
});
