import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import Subject from "@/models/Subject";
import Timetable, { ITimetableSlot } from "@/models/Timetable";
import { getAuth } from "@/lib/api-auth";

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

    const teaching = teacher.teaching ?? [];
    if (teaching.length === 0) return NextResponse.json({ classes: [] });

    const subjects = await Subject.find({ department: teacher.department, teacherIds: teacher._id })
      .select("name")
      .lean();
    const subjectNames = new Set(subjects.map((subject) => subject.name));

    const today = todayIndex();
    const orConditions = teaching.map((assignment) => ({
      branch: assignment.branch,
      semester: assignment.year,
      section: { $in: assignment.sections },
      dayOfWeek: today,
    }));

    const rows = await Timetable.find({ $or: orConditions }).lean();

    const classes = rows
      .flatMap((row) =>
        row.slots
          .filter((slot: ITimetableSlot) => subjectNames.has(slot.subject))
          .map((slot: ITimetableSlot) => ({
            subject: slot.subject,
            period: slot.period,
            time: slot.time ?? "",
            room: slot.room ?? "",
            branch: row.branch,
            section: row.section,
          }))
      )
      .sort((a, b) => a.period - b.period);

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Teacher schedule GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
