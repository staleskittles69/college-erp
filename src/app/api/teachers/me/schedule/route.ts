import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import LeaveRequest from "@/models/LeaveRequest";
import Substitution, { ISubstitution } from "@/models/Substitution";
import { getAuth } from "@/lib/api-auth";
import { classKey, getAttendanceTakenClassKeys, getTeacherClasses } from "@/lib/teacherSchedule";

// dayOfWeek is stored Monday-first (0=Mon..5=Sat), matching src/lib/academics.ts DAYS.
function todayIndex(): number {
  const jsDay = new Date().getDay(); // JS Date: 0=Sun..6=Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const teacher = await Teacher.findOne({ userId: payload.userId }).lean() as ITeacher | null;
    if (!teacher) return NextResponse.json({ classes: [] });

    // Same YYYY-MM-DD the Attendance page defaults to and saves under.
    const dateISO = new Date().toISOString().slice(0, 10);
    const today = new Date(dateISO);

    const [ownEntries, onLeave, coverDocs] = await Promise.all([
      getTeacherClasses(teacher, todayIndex()),
      LeaveRequest.exists({ teacherId: teacher._id, status: "approved", fromDate: { $lte: today }, toDate: { $gte: today } }),
      Substitution.find({ $or: [{ substituteTeacherId: teacher._id }, { originalTeacherId: teacher._id }], date: today })
        .lean<ISubstitution[]>(),
    ]);

    const teacherNames = new Map(
      (
        await Teacher.find({
          _id: { $in: coverDocs.flatMap((cover) => [cover.originalTeacherId, cover.substituteTeacherId]) },
        })
          .select("name")
          .lean<Array<{ _id: { toString: () => string }; name: string }>>()
      ).map((found) => [found._id.toString(), found.name])
    );

    const coversMine = coverDocs.filter((cover) => cover.substituteTeacherId.equals(teacher._id));
    const coveredByPeriod = new Map(
      coverDocs.filter((cover) => cover.originalTeacherId.equals(teacher._id)).map((cover) => [cover.period, cover])
    );

    const coverEntries = coversMine.map((cover) => ({
      subject: cover.subject,
      period: cover.period,
      time: cover.time,
      room: cover.room,
      branch: cover.branch,
      semester: cover.semester,
      section: cover.section,
    }));
    const takenKeys = await getAttendanceTakenClassKeys([...ownEntries, ...coverEntries], dateISO);

    const toRow = (
      entry: (typeof coverEntries)[number],
      extra: { status: "own" | "covering" | "on_leave"; coveringFor?: string; coveredBy?: string | null }
    ) => ({
      subject: entry.subject,
      period: entry.period,
      time: entry.time,
      room: entry.room,
      branch: entry.branch,
      // The timetable stores the class year in its `semester` field.
      year: entry.semester,
      section: entry.section,
      attendanceTaken: takenKeys.has(classKey(entry)),
      ...extra,
    });

    const classes = [
      ...ownEntries.map((entry) => {
        if (!onLeave) return toRow(entry, { status: "own" });
        const cover = coveredByPeriod.get(entry.period);
        return toRow(entry, {
          status: "on_leave",
          coveredBy: cover ? teacherNames.get(cover.substituteTeacherId.toString()) ?? null : null,
        });
      }),
      ...coverEntries.map((entry, index) =>
        toRow(entry, {
          status: "covering",
          coveringFor: teacherNames.get(coversMine[index].originalTeacherId.toString()) ?? "a colleague",
        })
      ),
    ].sort((a, b) => a.period - b.period);

    return NextResponse.json({ classes, onLeave: Boolean(onLeave) });
  } catch (error) {
    console.error("Teacher schedule GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
