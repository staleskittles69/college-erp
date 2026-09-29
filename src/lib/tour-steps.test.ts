import { describe, expect, it } from "vitest";
import { findPageTour, getTourPlan, TourRole } from "./tour-steps";

const pathFor = (role: TourRole, pathname: string) => findPageTour(getTourPlan(role), pathname)?.path ?? null;

describe("findPageTour", () => {
  it("matches a fixed route exactly", () => {
    expect(pathFor("student", "/student/grades")).toBe("/student/grades");
    expect(pathFor("admin", "/admin")).toBe("/admin");
  });

  it("fills in [bracketed] parts of the route", () => {
    expect(pathFor("admin", "/admin/cse/2nd-year/section-3")).toBe("/admin/[branch]/[year]/[section]");
    expect(pathFor("teacher", "/teachers/students/ece/1st-year")).toBe("/teachers/students/[branch]/[year]");
  });

  it("prefers the route with more fixed parts", () => {
    // Both could match "/admin/[branch]/[year]"; the named pages must win.
    expect(pathFor("admin", "/admin/teachers/cse")).toBe("/admin/teachers/[department]");
    expect(pathFor("admin", "/admin/features/marks")).toBe("/admin/features/marks");
    expect(pathFor("admin", "/admin/branches")).toBe("/admin/branches");
  });

  it("ignores a trailing slash", () => {
    expect(pathFor("student", "/student/timetable/")).toBe("/student/timetable");
  });

  it("returns null for pages with no tour", () => {
    expect(pathFor("student", "/student/does-not-exist/deeper")).toBeNull();
  });
});

describe("tour plans", () => {
  it.each(["admin", "teacher", "student"] as const)("%s: every page tour has a unique route and the dashboard has one", (role) => {
    const plan = getTourPlan(role);
    const paths = plan.pages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain(plan.home);
  });
});
