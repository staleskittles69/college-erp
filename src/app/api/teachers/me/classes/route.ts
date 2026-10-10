import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import Subject from "@/models/Subject";
import Substitution, { ISubstitution } from "@/models/Substitution";
import { getAuth } from "@/lib/api-auth";
import { collegeDateISO } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    const teacher = await Teacher.findOne({ userId: payload.userId }).lean() as ITeacher | null;
    if (!teacher) return NextResponse.json({ teaching: [], subjects: [] });

    const subjects = await Subject.find({ department: teacher.department, teacherIds: teacher._id })
      .select("name")
      .sort({ name: 1 })
      .lean();

    const teaching = teacher.teaching.map((assignment) => ({ ...assignment, sections: [...assignment.sections] }));
    const subjectNames = subjects.map((subject) => subject.name);

    // The Attendance page also needs today's covered classes, which sit outside the teacher's
    // own assignment. Other pages (notices, assignments, resources) shouldn't offer those.
    if (new URL(request.url).searchParams.get("includeCovering") === "true") {
      const covers = await Substitution.find({
        substituteTeacherId: teacher._id,
        date: new Date(collegeDateISO()),
      }).lean<ISubstitution[]>();

      for (const cover of covers) {
        const existing = teaching.find((item) => item.branch === cover.branch && item.year === cover.semester);
        if (!existing) {
          teaching.push({ branch: cover.branch, year: cover.semester, sections: [cover.section] });
        } else if (!existing.sections.includes(cover.section)) {
          existing.sections.push(cover.section);
        }
        if (!subjectNames.includes(cover.subject)) subjectNames.push(cover.subject);
      }
    }

    return NextResponse.json({ teaching, subjects: subjectNames });
  } catch (error) {
    console.error("teachers/me/classes GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
