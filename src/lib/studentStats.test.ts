import { describe, it, expect } from "vitest";
import { percentage, summarizeAttendance, summarizeMarks, teachesClass } from "./studentStats";

describe("percentage", () => {
  it("rounds to one decimal place", () => {
    expect(percentage(2, 3)).toBe(66.7);
  });

  it("returns null when there is nothing to divide by", () => {
    expect(percentage(0, 0)).toBeNull();
  });
});

describe("summarizeAttendance", () => {
  it("totals overall and per subject, and sorts subjects by name", () => {
    const result = summarizeAttendance([
      { subject: "Maths", status: "present" },
      { subject: "Maths", status: "absent" },
      { subject: "Physics", status: "present" },
    ]);
    expect(result.overall).toEqual({ present: 2, total: 3, pct: 66.7 });
    expect(result.subjects.map((s) => s.subject)).toEqual(["Maths", "Physics"]);
    expect(result.subjects[0]).toMatchObject({ present: 1, total: 2, pct: 50 });
  });

  it("flags low attendance below 75% but not at exactly 75%", () => {
    const low = summarizeAttendance([
      { subject: "A", status: "present" },
      { subject: "A", status: "absent" },
    ]);
    expect(low.lowAttendance).toBe(true);

    const exact = summarizeAttendance([
      { subject: "A", status: "present" },
      { subject: "A", status: "present" },
      { subject: "A", status: "present" },
      { subject: "A", status: "absent" },
    ]);
    expect(exact.overall.pct).toBe(75);
    expect(exact.lowAttendance).toBe(false);
  });

  it("does not flag a student with no records", () => {
    const result = summarizeAttendance([]);
    expect(result.overall.pct).toBeNull();
    expect(result.lowAttendance).toBe(false);
  });
});

describe("summarizeMarks", () => {
  it("combines exams per subject and marks a backlog below 40%", () => {
    const result = summarizeMarks([
      { subject: "Maths", examType: "Mid Term", obtained: 10, max: 50 },
      { subject: "Maths", examType: "Semester", obtained: 20, max: 100 },
      { subject: "Physics", examType: "Mid Term", obtained: 40, max: 50 },
    ]);
    const maths = result.subjects.find((s) => s.subject === "Maths");
    expect(maths).toMatchObject({ obtained: 30, max: 150, pct: 20, backlog: true });
    expect(result.subjects.find((s) => s.subject === "Physics")?.backlog).toBe(false);
    expect(result.backlogCount).toBe(1);
  });

  it("returns nothing for a student with no marks", () => {
    expect(summarizeMarks([])).toEqual({ subjects: [], backlogCount: 0 });
  });
});

describe("teachesClass", () => {
  const teaching = [{ branch: "CSE", year: 2, sections: ["Section 1", "Section 2"] }];

  it("matches a student in an assigned branch, year and section", () => {
    expect(teachesClass(teaching, { branch: "CSE", year: 2, section: "Section 2" })).toBe(true);
  });

  it("rejects a different section, year or branch", () => {
    expect(teachesClass(teaching, { branch: "CSE", year: 2, section: "Section 3" })).toBe(false);
    expect(teachesClass(teaching, { branch: "CSE", year: 3, section: "Section 1" })).toBe(false);
    expect(teachesClass(teaching, { branch: "ECE", year: 2, section: "Section 1" })).toBe(false);
  });

  it("rejects a student with no section", () => {
    expect(teachesClass(teaching, { branch: "CSE", year: 2 })).toBe(false);
  });
});
