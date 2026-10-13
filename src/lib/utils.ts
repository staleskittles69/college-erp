export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Mongoose's lean() documents type _id as unknown; this converts it for JSON responses.
export function toIdString(id: unknown): string {
  return (id as { toString: () => string }).toString();
}

// Escape regex metacharacters so user input is treated as a literal string in $regex queries.
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Accepts a clock time like "10:00 AM" or a class period like "Period 3".
const TEST_TIME_FORMAT = /^((0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)|Period\s?\d+)$/i;

export function isValidTestTime(value: string): boolean {
  return TEST_TIME_FORMAT.test(value.trim());
}

// Today's date as YYYY-MM-DD in the browser's own time zone. (toISOString() gives the UTC date,
// which in India is still yesterday until 5:30 AM.)
export function localDateISO(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const COLLEGE_TIME_ZONE = "Asia/Kolkata";

// Today's date as YYYY-MM-DD in the college's time zone. For server code: Vercel runs on UTC,
// where the date doesn't change until 5:30 AM in India.
export function collegeDateISO(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COLLEGE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// The moment today began (midnight) in the college's time zone, for "since today" database queries.
// India is always UTC+5:30 (no daylight saving), so the offset can be written out.
export function collegeDayStart(date: Date = new Date()): Date {
  return new Date(`${collegeDateISO(date)}T00:00:00+05:30`);
}
