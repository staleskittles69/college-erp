// Academic roll number (Student.rollNo, what students log in with):
// {2-digit admission batch}{3-letter branch code}{5-digit sequence}
// e.g. "25CSE00001" — batch 2025, CSE, student #1 in that branch+year. The sequence counts across
// the whole branch+year. (User.rollNumber is different: the serial number within the section.)
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

// "year" here is the 1-4 year-of-study, matching the 26 - year convention used across the seed scripts.
export function currentBatchYear(year: number): number {
  return 26 - year;
}

/** Everything before the 5-digit sequence, e.g. "25CSE". */
export function rollNoPrefix(branch: string, year: number): string {
  return `${currentBatchYear(year)}${branchCode(branch)}`;
}

export function formatRollNo(branch: string, year: number, sequence: number): string {
  return `${rollNoPrefix(branch, year)}${String(sequence).padStart(5, "0")}`;
}

export function rollNoToEmail(rollNo: string): string {
  return `${rollNo.toLowerCase()}@college.edu`;
}
