// Pure date/availability helpers for leave requests. Dates are always "YYYY-MM-DD" strings
// (the same shape the Attendance page saves under) so comparisons are plain string comparisons.

export const MAX_LEAVE_DAYS = 60;
export const MAX_REASON_LENGTH = 500;

export function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Every date from `from` to `to`, inclusive. */
export function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** Monday-first weekday (0=Mon..6=Sun), matching Timetable.dayOfWeek. */
export function weekdayIndex(dateISO: string): number {
  const jsDay = new Date(`${dateISO}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function rangesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

/** Returns an error message for a bad leave request, or null when it's fine. */
export function validateLeaveInput(
  input: { fromDate: unknown; toDate: unknown; reason: unknown },
  todayISO: string
): string | null {
  if (!isISODate(input.fromDate) || !isISODate(input.toDate)) return "Please pick a valid start and end date.";
  if (input.fromDate < todayISO) return "Leave can't start in the past.";
  if (input.toDate < input.fromDate) return "The end date can't be before the start date.";
  if (dateRange(input.fromDate, input.toDate).length > MAX_LEAVE_DAYS) {
    return `A leave request can cover at most ${MAX_LEAVE_DAYS} days.`;
  }
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!reason) return "Please give a reason for the leave.";
  if (reason.length > MAX_REASON_LENGTH) return `The reason must be ${MAX_REASON_LENGTH} characters or fewer.`;
  return null;
}

export const periodKey = (dateISO: string, period: number) => `${dateISO}|${period}`;

export interface Availability {
  /** Periods where the timetable suggests they have a class. Only an estimate, so it warns rather than blocks. */
  classPeriods: Set<string>;
  /** Periods they have already agreed to cover for someone else. */
  coverPeriods: Set<string>;
  /** Days they are on approved leave. */
  leaveDates: Set<string>;
}

export type SlotStatus = "free" | "has_class" | "unavailable";

/**
 * Can this teacher cover `period` on `dateISO`?
 * - "unavailable": on approved leave that day, or already covering another class that period. Never allowed.
 * - "has_class": the timetable suggests a class of their own then. Allowed, but the admin is warned.
 */
export function slotStatus(availability: Availability, dateISO: string, period: number): SlotStatus {
  const key = periodKey(dateISO, period);
  if (availability.leaveDates.has(dateISO) || availability.coverPeriods.has(key)) return "unavailable";
  return availability.classPeriods.has(key) ? "has_class" : "free";
}
