import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import { getAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const student = await Student.findOne({ userId: payload.userId })
    .select("branch semester section")
    .lean<{ branch: string; semester: number; section: string }>();
  if (!student) return NextResponse.json([]);

  const year = Math.ceil(student.semester / 2);
  const teachers = await Teacher.find({
    teaching: { $elemMatch: { branch: student.branch, year, sections: student.section } },
  })
    .select("name userId")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json(
    teachers.map((teacher) => ({
      userId: (teacher.userId as { toString: () => string }).toString(),
      name: teacher.name,
    }))
  );
}
