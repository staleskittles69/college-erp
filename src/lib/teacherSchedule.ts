import Subject from "@/models/Subject";
import Timetable, { ITimetableSlot } from "@/models/Timetable";
import { ITeacher } from "@/models/Teacher";
import User from "@/models/User";
import Attendance from "@/models/Attendance";

export interface TeacherClassEntry {
  subject: string;
  period: number;
  time: string;
  room: string;
  branch: string;
  semester: number;
  section: string;
  dayOfWeek: number;
}

// Assumes connectDB() has already been called by the caller.
export async function getTeacherClasses(
  teacher: Pick<ITeacher, "_id" | "department" | "teaching">,
  dayOfWeek?: number
): Promise<TeacherClassEntry[]> {
  const teaching = teacher.teaching ?? [];
  if (teaching.length === 0) return [];

  const subjects = await Subject.find({ department: teacher.department, teacherIds: teacher._id })
    .select("name")
    .lean();
  const subjectNames = new Set(subjects.map((subject) => subject.name));
  if (subjectNames.size === 0) return [];

  const orConditions = teaching.map((assignment) => ({
    branch: assignment.branch,
    semester: assignment.year,
    section: { $in: assignment.sections },
    ...(dayOfWeek != null ? { dayOfWeek } : {}),
  }));

  const rows = await Timetable.find({ $or: orConditions }).lean();

  const candidates = rows
    .flatMap((row) =>
      row.slots
        .filter((slot: ITimetableSlot) => subjectNames.has(slot.subject))
        .map((slot: ITimetableSlot) => ({
          subject: slot.subject,
          period: slot.period,
          time: slot.time ?? "",
          room: slot.room ?? "",
          branch: row.branch,
          semester: row.semester,
          section: row.section,
          dayOfWeek: row.dayOfWeek,
        }))
    )
    .sort((a, b) =>
      a.dayOfWeek - b.dayOfWeek || a.period - b.period || a.branch.localeCompare(b.branch) || a.section.localeCompare(b.section)
    );

  // A subject can have several teachers, but a Timetable slot doesn't record which one
  // actually covers a given section — so a teacher's own matches can collide on the same
  // day/period across different sections. Only one class can really happen then, so keep
  // the first (deterministic) match per day/period and drop the rest.
  const seenCells = new Set<string>();
  return candidates.filter((entry) => {
    const cellKey = `${entry.dayOfWeek}-${entry.period}`;
    if (seenCells.has(cellKey)) return false;
    seenCells.add(cellKey);
    return true;
  });
}

type ClassRef = Pick<TeacherClassEntry, "branch" | "semester" | "section" | "subject">;

export const classKey = ({ branch, semester, section, subject }: ClassRef) =>
  `${branch}|${semester}|${section}|${subject}`;

// Which of these classes already have attendance saved for `dateISO` (the same YYYY-MM-DD the
// Attendance page saves under)? Attendance is one record per student/subject/day, so a subject
// with several periods in a day shares one answer — hence one lookup per distinct class, not per
// period. Assumes connectDB() has already been called by the caller.
export async function getAttendanceTakenClassKeys(entries: ClassRef[], dateISO: string): Promise<Set<string>> {
  const distinct = new Map(entries.map((entry) => [classKey(entry), entry]));
  const date = new Date(dateISO);

  const results = await Promise.all(
    [...distinct.entries()].map(async ([key, { branch, semester, section, subject }]) => {
      // Timetable.semester holds the class year (see getTeacherClasses), matching User.year.
      const students = await User.find({ role: "student", branch, year: semester, section }).select("_id").lean();
      if (students.length === 0) return null;
      const taken = await Attendance.exists({
        studentId: { $in: students.map((student) => student._id) },
        subject,
        date,
      });
      return taken ? key : null;
    })
  );

  return new Set(results.filter((key): key is string => key !== null));
}
