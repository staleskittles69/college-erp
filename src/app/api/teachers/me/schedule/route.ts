import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
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

    const entries = await getTeacherClasses(teacher, todayIndex());
    // Same YYYY-MM-DD the Attendance page defaults to and saves under.
    const takenKeys = await getAttendanceTakenClassKeys(entries, new Date().toISOString().slice(0, 10));
    const classes = entries.map((entry) => ({
      subject: entry.subject,
      period: entry.period,
      time: entry.time,
      room: entry.room,
      branch: entry.branch,
      // The timetable stores the class year in its `semester` field.
      year: entry.semester,
      section: entry.section,
      attendanceTaken: takenKeys.has(classKey(entry)),
    }));

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Teacher schedule GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
