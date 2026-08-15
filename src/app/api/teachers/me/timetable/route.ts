import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import { getAuth } from "@/lib/api-auth";
import { getTeacherClasses } from "@/lib/teacherSchedule";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const teacher = await Teacher.findOne({ userId: payload.userId }).lean() as ITeacher | null;
    if (!teacher) return NextResponse.json({ classes: [] });

    const classes = await getTeacherClasses(teacher);
    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Teacher timetable GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
