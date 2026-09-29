export const BRANCHES = ["CSE", "ECE", "ME", "CE", "EEE"];
export const YEARS = [1, 2, 3, 4];
export const BACKLOG_FAIL_THRESHOLD_PCT = 40;
export const LOW_ATTENDANCE_THRESHOLD_PCT = 75;
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PERIODS = [1, 2, 3, 4, 5, 6];
export const TEST_TYPES = ["Unit Test", "Mid Term", "Semester", "Quiz", "Assignment Test"];

export const PERIOD_TIMES: Record<number, string> = {
  1: "9:00 AM – 9:50 AM",
  2: "9:50 AM – 10:40 AM",
  3: "10:55 AM – 11:45 AM",
  4: "11:45 AM – 12:35 PM",
  5: "1:20 PM – 2:10 PM",
  6: "2:10 PM – 3:00 PM",
};

/** How long after a period starts the teacher's "Take attendance" button stays available. */
export const ATTENDANCE_WINDOW_MINUTES = 10;

const TIME_RANGE = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i;

// One clock reading -> minutes since midnight. With an explicit AM/PM it's read literally.
// Without one (timetable rows saved before AM/PM was added, e.g. "1:20 – 2:10") it assumes a
// school day: 8–12 is morning/noon, 1–7 is afternoon.
function toMinutes(hour: number, minute: number, meridiem?: string): number | null {
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    return ((hour % 12) + (meridiem.toUpperCase() === "PM" ? 12 : 0)) * 60 + minute;
  }
  if (hour > 23) return null;
  return (hour < 8 ? hour + 12 : hour) * 60 + minute;
}

/** Parses "9:00 AM – 9:50 AM" (or the older "9:00 – 9:50") into minutes since midnight; null if unreadable. */
export function parsePeriodTime(time: string): { start: number; end: number } | null {
  const match = TIME_RANGE.exec(time);
  if (!match) return null;
  const start = toMinutes(Number(match[1]), Number(match[2]), match[3]);
  const end = toMinutes(Number(match[4]), Number(match[5]), match[6]);
  return start === null || end === null ? null : { start, end };
}

function formatMinutes(totalMinutes: number): string {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour24 % 12 || 12}:${minute} ${hour24 >= 12 ? "PM" : "AM"}`;
}

/** Adds AM/PM to older saved times; already-labelled times come back the same. Unreadable text is returned as-is. */
export function formatPeriodTime(time: string): string {
  const range = parsePeriodTime(time);
  return range ? `${formatMinutes(range.start)} – ${formatMinutes(range.end)}` : time;
}

/** True during the first ATTENDANCE_WINDOW_MINUTES of a period: open at the start time, closed exactly 10 minutes later. */
export function isAttendanceWindowOpen(time: string, now: Date): boolean {
  const range = parsePeriodTime(time);
  if (!range) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= range.start && nowMinutes < range.start + ATTENDANCE_WINDOW_MINUTES;
}

const YEAR_SUFFIXES: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

export function yearLabel(year: number | string): string {
  const numericYear = Number(year);
  return `${YEAR_SUFFIXES[numericYear] ?? `${numericYear}th`} Year`;
}

export function isAssignmentType(testType?: string | null): boolean {
  return !!testType && testType.toLowerCase().includes("assignment");
}

const YEAR_SLUGS: Record<number, string> = { 1: "1st-year", 2: "2nd-year", 3: "3rd-year", 4: "4th-year" };

export function studentDetailUrl(student: { _id: string; branch: string; year: number; section: string }): string {
  const branch = student.branch.toLowerCase();
  const year = YEAR_SLUGS[student.year] ?? "1st-year";
  const section = student.section.toLowerCase().replace(/\s+/g, "-");
  return `/admin/${branch}/${year}/${section}/${student._id}`;
}

/** Link to the teacher Attendance page with this class already selected. */
export function teacherAttendanceUrl(cls: { branch: string; year: number; section: string; subject: string }): string {
  const params = new URLSearchParams({
    branch: cls.branch,
    year: String(cls.year),
    section: cls.section,
    subject: cls.subject,
  });
  return `/teachers/attendance?${params.toString()}`;
}
