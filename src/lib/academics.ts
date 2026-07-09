export const BRANCHES = ["CSE", "ECE", "ME", "CE", "EEE"];
export const YEARS = [1, 2, 3, 4];
export const SECTIONS = ["A", "B", "C", "D"];
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PERIODS = [1, 2, 3, 4, 5, 6];
export const TEST_TYPES = ["Unit Test", "Mid Term", "Semester", "Quiz", "Assignment Test"];

export const PERIOD_TIMES: Record<number, string> = {
  1: "9:00 – 9:50",
  2: "9:50 – 10:40",
  3: "10:55 – 11:45",
  4: "11:45 – 12:35",
  5: "1:20 – 2:10",
  6: "2:10 – 3:00",
};

const YEAR_SUFFIXES: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

export function yearLabel(year: number | string): string {
  const numericYear = Number(year);
  return `${YEAR_SUFFIXES[numericYear] ?? `${numericYear}th`} Year`;
}
