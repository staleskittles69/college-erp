import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import User from "@/models/User";
import Test from "@/models/Test";
import Query from "@/models/Query";
import { getAuth } from "@/lib/api-auth";
import { collegeDateISO } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
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

    const [pendingAssignments, openQueries] = await Promise.all([
      Test.countDocuments({ createdBy: payload.userId, date: { $gte: new Date(collegeDateISO()) } }),
      Query.countDocuments({ toRole: "teacher", toUserId: payload.userId, status: "open" }),
    ]);

    return NextResponse.json({
      studentCount,
      pendingAssignments,
      openQueries,
      sectionCount,
      classCount: teaching.length,
      teaching,
    });
  } catch (error) {
    console.error("teachers/me/stats GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
