import Subject from "@/models/Subject";
import Timetable, { ITimetableSlot } from "@/models/Timetable";
import { ITeacher } from "@/models/Teacher";

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

  return rows
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
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period);
}
