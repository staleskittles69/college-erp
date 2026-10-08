import LeaveRequest from "@/models/LeaveRequest";
import Substitution from "@/models/Substitution";
import { ITeacher } from "@/models/Teacher";
import { getTeacherClasses, TeacherClassEntry } from "@/lib/teacherSchedule";
import { Availability, dateRange, periodKey, weekdayIndex } from "@/lib/leave";

// All helpers assume connectDB() has already been called by the caller.

type TeacherForSchedule = Pick<ITeacher, "_id" | "department" | "teaching">;

export interface AffectedClass {
  date: string; // YYYY-MM-DD
  period: number;
  time: string;
  room: string;
  subject: string;
  branch: string;
  semester: number; // class year
  section: string;
}

/** Class entries for a teacher on each weekday, fetched once per distinct weekday. */
async function classesByWeekday(teacher: TeacherForSchedule, dates: string[]) {
  const weekdays = [...new Set(dates.map(weekdayIndex))];
  const entries = await Promise.all(
    weekdays.map(async (weekday) => [weekday, await getTeacherClasses(teacher, weekday)] as const)
  );
  return new Map<number, TeacherClassEntry[]>(entries);
}

/** Every class this teacher would normally take between `fromISO` and `toISO`. */
export async function getAffectedClasses(
  teacher: TeacherForSchedule,
  fromISO: string,
  toISO: string
): Promise<AffectedClass[]> {
  const dates = dateRange(fromISO, toISO);
  const byWeekday = await classesByWeekday(teacher, dates);

  return dates.flatMap((date) =>
    (byWeekday.get(weekdayIndex(date)) ?? []).map((entry) => ({
      date,
      period: entry.period,
      time: entry.time,
      room: entry.room,
      subject: entry.subject,
      branch: entry.branch,
      semester: entry.semester,
      section: entry.section,
    }))
  );
}

/**
 * When is this teacher unavailable on these dates? Class periods come from their own timetable,
 * cover periods from classes they already agreed to take, and leave dates from their approved
 * leave. Pass `ignoreLeaveRequestId` to leave out the request currently being decided.
 */
export async function getAvailability(
  teacher: TeacherForSchedule,
  dates: string[],
  ignoreLeaveRequestId?: string
): Promise<Availability> {
  const [byWeekday, covers, leaves] = await Promise.all([
    classesByWeekday(teacher, dates),
    Substitution.find({
      substituteTeacherId: teacher._id,
      date: { $in: dates.map((date) => new Date(date)) },
    })
      .select("date period")
      .lean<Array<{ date: Date; period: number }>>(),
    LeaveRequest.find({
      teacherId: teacher._id,
      status: "approved",
      fromDate: { $lte: new Date(dates[dates.length - 1]) },
      toDate: { $gte: new Date(dates[0]) },
      ...(ignoreLeaveRequestId ? { _id: { $ne: ignoreLeaveRequestId } } : {}),
    })
      .select("fromDate toDate")
      .lean<Array<{ fromDate: Date; toDate: Date }>>(),
  ]);

  const classPeriods = new Set<string>();
  for (const date of dates) {
    for (const entry of byWeekday.get(weekdayIndex(date)) ?? []) classPeriods.add(periodKey(date, entry.period));
  }
  const coverPeriods = new Set(covers.map((cover) => periodKey(cover.date.toISOString().slice(0, 10), cover.period)));

  const leaveDates = new Set<string>();
  for (const leave of leaves) {
    for (const date of dateRange(leave.fromDate.toISOString().slice(0, 10), leave.toDate.toISOString().slice(0, 10))) {
      leaveDates.add(date);
    }
  }

  return { classPeriods, coverPeriods, leaveDates };
}

export function serializeLeave(leave: {
  _id: { toString: () => string };
  teacherName: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  decidedAt?: Date;
  createdAt: Date;
}) {
  return {
    _id: leave._id.toString(),
    teacherName: leave.teacherName,
    fromDate: leave.fromDate.toISOString().slice(0, 10),
    toDate: leave.toDate.toISOString().slice(0, 10),
    reason: leave.reason,
    status: leave.status,
    adminNote: leave.adminNote ?? null,
    decidedAt: leave.decidedAt ?? null,
    createdAt: leave.createdAt,
  };
}
