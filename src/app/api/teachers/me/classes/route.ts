import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import { getAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const teacher = await Teacher.findOne({ userId: payload.userId }).lean() as ITeacher | null;
  if (!teacher) return NextResponse.json({ teaching: [], subjects: [] });

  return NextResponse.json({
    teaching: teacher.teaching,
    subjects: teacher.subjects,
  });
}
