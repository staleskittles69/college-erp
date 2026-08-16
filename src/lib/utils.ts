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
