import { describe, it, expect } from "vitest";
import {
  dateRange,
  isISODate,
  periodKey,
  slotStatus,
  rangesOverlap,
  validateLeaveInput,
  weekdayIndex,
  MAX_LEAVE_DAYS,
} from "./leave";

describe("isISODate", () => {
  it("accepts real dates and rejects malformed or impossible ones", () => {
    expect(isISODate("2026-10-08")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("08-10-2026")).toBe(false);
    expect(isISODate(undefined)).toBe(false);
  });
});

describe("dateRange", () => {
  it("includes both ends", () => {
    expect(dateRange("2026-10-08", "2026-10-10")).toEqual(["2026-10-08", "2026-10-09", "2026-10-10"]);
  });

  it("returns one date for a single-day range", () => {
    expect(dateRange("2026-10-08", "2026-10-08")).toEqual(["2026-10-08"]);
  });

  it("crosses a month boundary", () => {
    expect(dateRange("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });
});

describe("weekdayIndex", () => {
  it("is Monday-first", () => {
    expect(weekdayIndex("2026-10-05")).toBe(0); // Monday
    expect(weekdayIndex("2026-10-10")).toBe(5); // Saturday
    expect(weekdayIndex("2026-10-11")).toBe(6); // Sunday
  });
});

describe("rangesOverlap", () => {
  it("detects overlap, including touching ends", () => {
    expect(rangesOverlap("2026-10-01", "2026-10-05", "2026-10-05", "2026-10-08")).toBe(true);
    expect(rangesOverlap("2026-10-01", "2026-10-05", "2026-10-02", "2026-10-03")).toBe(true);
  });

  it("detects separate ranges", () => {
    expect(rangesOverlap("2026-10-01", "2026-10-05", "2026-10-06", "2026-10-08")).toBe(false);
  });
});

describe("validateLeaveInput", () => {
  const today = "2026-10-08";
  const ok = { fromDate: "2026-10-09", toDate: "2026-10-10", reason: "Family function" };

  it("accepts a valid request, including one starting today", () => {
    expect(validateLeaveInput(ok, today)).toBeNull();
    expect(validateLeaveInput({ ...ok, fromDate: today }, today)).toBeNull();
  });

  it("rejects past, reversed and malformed dates", () => {
    expect(validateLeaveInput({ ...ok, fromDate: "2026-10-07" }, today)).toMatch(/past/);
    expect(validateLeaveInput({ ...ok, toDate: "2026-10-08" }, today)).toMatch(/before/);
    expect(validateLeaveInput({ ...ok, fromDate: "tomorrow" }, today)).toMatch(/valid/);
  });

  it("requires a reason and caps its length", () => {
    expect(validateLeaveInput({ ...ok, reason: "   " }, today)).toMatch(/reason/);
    expect(validateLeaveInput({ ...ok, reason: "x".repeat(501) }, today)).toMatch(/500/);
  });

  it("rejects ranges longer than the limit", () => {
    const longTo = dateRange("2026-10-09", "2027-12-31")[MAX_LEAVE_DAYS];
    expect(validateLeaveInput({ ...ok, toDate: longTo }, today)).toMatch(/at most/);
  });
});

describe("slotStatus", () => {
  const availability = {
    classPeriods: new Set([periodKey("2026-10-09", 2)]),
    coverPeriods: new Set([periodKey("2026-10-09", 4)]),
    leaveDates: new Set(["2026-10-12"]),
  };

  it("is free when nothing clashes", () => {
    expect(slotStatus(availability, "2026-10-09", 3)).toBe("free");
  });

  it("warns, but does not block, when the timetable shows a class of their own", () => {
    expect(slotStatus(availability, "2026-10-09", 2)).toBe("has_class");
  });

  it("is unavailable when already covering that period", () => {
    expect(slotStatus(availability, "2026-10-09", 4)).toBe("unavailable");
  });

  it("is unavailable for every period on a leave day, even with no class", () => {
    expect(slotStatus(availability, "2026-10-12", 1)).toBe("unavailable");
  });

  it("lets a cover or leave clash win over a class warning", () => {
    const both = {
      classPeriods: new Set([periodKey("2026-10-09", 4)]),
      coverPeriods: new Set([periodKey("2026-10-09", 4)]),
      leaveDates: new Set<string>(),
    };
    expect(slotStatus(both, "2026-10-09", 4)).toBe("unavailable");
  });
});
