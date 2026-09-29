import { describe, it, expect } from "vitest";
import {
  yearLabel,
  isAssignmentType,
  studentDetailUrl,
  PERIOD_TIMES,
  parsePeriodTime,
  formatPeriodTime,
  isAttendanceWindowOpen,
  teacherAttendanceUrl,
} from "./academics";

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

describe("parsePeriodTime", () => {
  it("reads explicit AM/PM literally", () => {
    expect(parsePeriodTime("9:00 AM – 9:50 AM")).toEqual({ start: 9 * 60, end: 9 * 60 + 50 });
    expect(parsePeriodTime("11:45 AM – 12:35 PM")).toEqual({ start: 11 * 60 + 45, end: 12 * 60 + 35 });
    expect(parsePeriodTime("1:20 PM – 2:10 PM")).toEqual({ start: 13 * 60 + 20, end: 14 * 60 + 10 });
  });

  it("reads older saved times with no AM/PM as a school day, so 1:20 is afternoon", () => {
    expect(parsePeriodTime("9:00 – 9:50")).toEqual({ start: 9 * 60, end: 9 * 60 + 50 });
    expect(parsePeriodTime("11:45 – 12:35")).toEqual({ start: 11 * 60 + 45, end: 12 * 60 + 35 });
    expect(parsePeriodTime("1:20 – 2:10")).toEqual({ start: 13 * 60 + 20, end: 14 * 60 + 10 });
  });

  it("accepts a plain hyphen as well as an en dash", () => {
    expect(parsePeriodTime("9:00-9:50")).toEqual(parsePeriodTime("9:00 – 9:50"));
  });

  it("returns null for empty or unreadable text", () => {
    expect(parsePeriodTime("")).toBeNull();
    expect(parsePeriodTime("Morning")).toBeNull();
    expect(parsePeriodTime("9:75 – 10:00")).toBeNull();
    expect(parsePeriodTime("13:00 PM – 14:00 PM")).toBeNull();
  });
});

describe("formatPeriodTime", () => {
  it("adds AM/PM to every older-style period time", () => {
    expect(formatPeriodTime("9:00 – 9:50")).toBe("9:00 AM – 9:50 AM");
    expect(formatPeriodTime("9:50 – 10:40")).toBe("9:50 AM – 10:40 AM");
    expect(formatPeriodTime("10:55 – 11:45")).toBe("10:55 AM – 11:45 AM");
    expect(formatPeriodTime("11:45 – 12:35")).toBe("11:45 AM – 12:35 PM");
    expect(formatPeriodTime("1:20 – 2:10")).toBe("1:20 PM – 2:10 PM");
    expect(formatPeriodTime("2:10 – 3:00")).toBe("2:10 PM – 3:00 PM");
  });

  it("leaves already-labelled times unchanged, including everything in PERIOD_TIMES", () => {
    Object.values(PERIOD_TIMES).forEach((time) => {
      expect(formatPeriodTime(time)).toBe(time);
    });
  });

  it("returns empty or unreadable text as-is", () => {
    expect(formatPeriodTime("")).toBe("");
    expect(formatPeriodTime("TBA")).toBe("TBA");
  });
});

describe("isAttendanceWindowOpen", () => {
  const at = (hours: number, minutes: number, seconds = 0) => new Date(2026, 8, 28, hours, minutes, seconds);

  it("is open from the period start until exactly 10 minutes later", () => {
    expect(isAttendanceWindowOpen("9:00 AM – 9:50 AM", at(9, 0))).toBe(true);
    expect(isAttendanceWindowOpen("9:00 AM – 9:50 AM", at(9, 9, 59))).toBe(true);
    expect(isAttendanceWindowOpen("9:00 AM – 9:50 AM", at(9, 10))).toBe(false);
  });

  it("is closed before the period starts and after the window", () => {
    expect(isAttendanceWindowOpen("9:00 AM – 9:50 AM", at(8, 59, 59))).toBe(false);
    expect(isAttendanceWindowOpen("9:00 AM – 9:50 AM", at(9, 45))).toBe(false);
  });

  it("works for afternoon periods, in both the new and older time formats", () => {
    expect(isAttendanceWindowOpen("1:20 PM – 2:10 PM", at(13, 25))).toBe(true);
    expect(isAttendanceWindowOpen("1:20 – 2:10", at(13, 25))).toBe(true);
    expect(isAttendanceWindowOpen("1:20 – 2:10", at(1, 25))).toBe(false);
  });

  it("is closed for empty or unreadable times", () => {
    expect(isAttendanceWindowOpen("", at(9, 5))).toBe(false);
    expect(isAttendanceWindowOpen("TBA", at(9, 5))).toBe(false);
  });
});

describe("teacherAttendanceUrl", () => {
  it("encodes the class into the query string so it round-trips through URLSearchParams", () => {
    const url = teacherAttendanceUrl({
      branch: "CSE",
      year: 2,
      section: "Section 1",
      subject: "Data Structures & Algorithms",
    });
    expect(url.startsWith("/teachers/attendance?")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("branch")).toBe("CSE");
    expect(params.get("year")).toBe("2");
    expect(params.get("section")).toBe("Section 1");
    expect(params.get("subject")).toBe("Data Structures & Algorithms");
  });
});
