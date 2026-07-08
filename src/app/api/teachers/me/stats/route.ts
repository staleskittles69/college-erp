import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const teacher = await Teacher.findOne({ userId: payload.userId }).lean() as ITeacher | null;
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  const teaching = teacher.teaching ?? [];
  const sectionCount = teaching.reduce((total, assignment) => total + assignment.sections.length, 0);

  let studentCount = 0;
  if (teaching.length > 0) {
    const orConditions = teaching.flatMap((assignment) =>
      assignment.sections.map((section) => ({
        branch: assignment.branch,
        year: assignment.year,
        section,
      }))
    );
    studentCount = await User.countDocuments({ role: "student", $or: orConditions });
  }

  return NextResponse.json({
    studentCount,
    sectionCount,
    classCount: teaching.length,
    teaching,
  });
}
