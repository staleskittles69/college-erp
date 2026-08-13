// Canonical roll number format: {2-digit admission batch}{3-letter branch code}{5-digit sequence}
// e.g. "25CSE00001" — batch 2025, CSE, student #1 in that branch+year.
export const BRANCH_CODES: Record<string, string> = {
  CSE: "CSE",
  ECE: "ECE",
  ME: "MEC",
  CE: "CIV",
  EEE: "EEE",
};

export function branchCode(branch: string): string {
  return BRANCH_CODES[branch] ?? branch.slice(0, 3).toUpperCase();
}

// Roll numbers restart at 1 per branch+year batch; "year" here is the 1-4 year-of-study,
// matching the same 26 - year convention already used across the seed scripts.
export function currentBatchYear(year: number): number {
  return 26 - year;
}

export function formatRollNo(branch: string, year: number, sequence: number): string {
  return `${currentBatchYear(year)}${branchCode(branch)}${String(sequence).padStart(5, "0")}`;
}

export function rollNoToEmail(rollNo: string): string {
  return `${rollNo.toLowerCase()}@college.edu`;
}
