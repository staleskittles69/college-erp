import Teacher, { ITeacher } from "@/models/Teacher";
import Subject from "@/models/Subject";
import Substitution from "@/models/Substitution";
import { TeachingAssignment, teachesClass } from "@/lib/studentStats";
import type { JwtPayload } from "@/lib/auth";

// What a teacher is allowed to write to. Admins aren't limited.
// All async helpers assume connectDB() has already been called by the caller.

export interface ClassTarget {
  branch?: string | null;
  year?: number | null;
  section?: string | null;
}

/**
 * May a teacher with these assignments post to this branch / year / section? An empty part means
 * "all of them": no branch = the whole college, a branch with no year = every year of that branch.
 * Matches what the teacher Notices and Assignments forms offer.
 */
export function canTargetClass(teaching: TeachingAssignment[], target: ClassTarget): boolean {
  if (!target.branch) return target.year == null && !target.section;
  const inBranch = teaching.filter((assignment) => assignment.branch === target.branch);
  if (inBranch.length === 0) return false;
  if (target.year == null) return !target.section;
  const assignment = inBranch.find((item) => item.year === target.year);
  if (!assignment) return false;
  return !target.section || assignment.sections.includes(target.section);
}

export async function findTeacher(userId: string): Promise<ITeacher | null> {
  return Teacher.findOne({ userId }).lean<ITeacher>();
}

/** canTargetClass for whoever is making the request: admins may target anything. */
export async function mayTargetClass(payload: JwtPayload, target: ClassTarget): Promise<boolean> {
  if (payload.role === "admin") return true;
  if (payload.role !== "teacher") return false;
  const teacher = await findTeacher(payload.userId);
  return Boolean(teacher) && canTargetClass(teacher!.teaching ?? [], target);
}

export const NOT_YOUR_CLASS = "You can only post to the classes you teach";

/**
 * May this teacher take attendance for this class, subject, date and period? Yes if it's one of
 * their own classes and subjects, or a class they've been assigned to cover at that exact period.
 */
export async function canMarkAttendance(
  teacher: Pick<ITeacher, "_id" | "department" | "teaching">,
  cls: { branch: string; year: number; section: string },
  subject: string,
  date: Date,
  period: number
): Promise<boolean> {
  if (teachesClass(teacher.teaching ?? [], cls)) {
    const teachesSubject = await Subject.exists({ department: teacher.department, teacherIds: teacher._id, name: subject });
    if (teachesSubject) return true;
  }
  const covering = await Substitution.exists({
    substituteTeacherId: teacher._id,
    date,
    period,
    branch: cls.branch,
    // Substitution.semester holds the class year, like Timetable.semester.
    semester: cls.year,
    section: cls.section,
    subject,
  });
  return Boolean(covering);
}
