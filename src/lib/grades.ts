export const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  A: "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  B: "bg-blue-50 text-blue-600",
  "C+": "bg-yellow-100 text-yellow-700",
  C: "bg-orange-100 text-orange-700",
  D: "bg-red-100 text-red-700",
};

export function calcGrade(obtained: number, max: number): string {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C+";
  if (pct >= 40) return "C";
  return "D";
}

export function gradePoint(pct: number): number {
  if (pct >= 90) return 10;
  if (pct >= 80) return 9;
  if (pct >= 70) return 8;
  if (pct >= 60) return 7;
  if (pct >= 50) return 6;
  if (pct >= 40) return 5;
  return 4;
}

export function computeCGPA(records: { subject: string; obtained: number; max: number }[]): number | null {
  const bySubject: Record<string, { obtained: number; max: number }> = {};
  records.forEach((record) => {
    if (!bySubject[record.subject]) bySubject[record.subject] = { obtained: 0, max: 0 };
    bySubject[record.subject].obtained += record.obtained;
    bySubject[record.subject].max += record.max;
  });
  const subjects = Object.values(bySubject);
  if (subjects.length === 0) return null;
  const totalPoints = subjects.reduce((sum, { obtained, max }) => sum + gradePoint((obtained / max) * 100), 0);
  return totalPoints / subjects.length;
}
