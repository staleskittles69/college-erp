import { BACKLOG_FAIL_THRESHOLD_PCT, LOW_ATTENDANCE_THRESHOLD_PCT } from "./academics";

// Same definitions the admin At-Risk pages use: a student is low on attendance below
// LOW_ATTENDANCE_THRESHOLD_PCT overall, and has a backlog in any subject whose combined
// marks come to less than BACKLOG_FAIL_THRESHOLD_PCT.

export function percentage(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export interface AttendanceRecord {
  subject: string;
  status: "present" | "absent";
}

export interface AttendanceRow {
  present: number;
  total: number;
  pct: number | null;
}

export function summarizeAttendance(records: AttendanceRecord[]) {
  const bySubject = new Map<string, { present: number; total: number }>();
  let present = 0;

  for (const record of records) {
    const entry = bySubject.get(record.subject) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (record.status === "present") {
      entry.present += 1;
      present += 1;
    }
    bySubject.set(record.subject, entry);
  }

  const overall: AttendanceRow = { present, total: records.length, pct: percentage(present, records.length) };
  const subjects = [...bySubject.entries()]
    .map(([subject, entry]) => ({ subject, ...entry, pct: percentage(entry.present, entry.total) }))
    .sort((a, b) => a.subject.localeCompare(b.subject));

  return {
    overall,
    subjects,
    lowAttendance: overall.pct !== null && overall.pct < LOW_ATTENDANCE_THRESHOLD_PCT,
  };
}

export interface MarkRecord {
  subject: string;
  examType: string;
  obtained: number;
  max: number;
}

export function summarizeMarks(records: MarkRecord[]) {
  const bySubject = new Map<string, MarkRecord[]>();
  for (const record of records) {
    const list = bySubject.get(record.subject) ?? [];
    list.push(record);
    bySubject.set(record.subject, list);
  }

  const subjects = [...bySubject.entries()]
    .map(([subject, exams]) => {
      const obtained = exams.reduce((sum, exam) => sum + exam.obtained, 0);
      const max = exams.reduce((sum, exam) => sum + exam.max, 0);
      const pct = percentage(obtained, max);
      return {
        subject,
        exams: exams.map(({ examType, obtained: got, max: outOf }) => ({ examType, obtained: got, max: outOf })),
        obtained,
        max,
        pct,
        backlog: pct !== null && pct < BACKLOG_FAIL_THRESHOLD_PCT,
      };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));

  return { subjects, backlogCount: subjects.filter((subject) => subject.backlog).length };
}

export interface TeachingAssignment {
  branch: string;
  year: number;
  sections: string[];
}

/** True when the teacher is assigned to this student's branch, year and section. */
export function teachesClass(
  teaching: TeachingAssignment[],
  student: { branch?: string; year?: number; section?: string }
): boolean {
  return teaching.some(
    (assignment) =>
      assignment.branch === student.branch &&
      assignment.year === student.year &&
      assignment.sections.includes(student.section ?? "")
  );
}
