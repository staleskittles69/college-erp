import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student, { IStudent } from "@/models/Student";
import Teacher, { ITeacher } from "@/models/Teacher";
import Attendance, { IAttendance } from "@/models/Attendance";
import Marks, { IMarks } from "@/models/Marks";
import { getAuth } from "@/lib/api-auth";
import { summarizeAttendance, summarizeMarks, teachesClass } from "@/lib/studentStats";

// GET /api/teachers/students/[id] — one student's progress and contact details, for a teacher
// who teaches that student's class. [id] is the student's User id (what the roster links use).
//
// Only contact fields are returned from the Student document — never ID numbers, bank details,
// income, caste or anything else from the admissions record.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const [teacher, user, student] = await Promise.all([
      Teacher.findOne({ userId: payload.userId }).lean() as Promise<ITeacher | null>,
      User.findById(id).select("name email role branch year section").lean<{
        name?: string;
        email?: string;
        role: string;
        branch?: string;
        year?: number;
        section?: string;
      }>(),
      Student.findOne({ userId: id }).lean<IStudent>(),
    ]);

    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    if (!user || user.role !== "student" || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!teachesClass(teacher.teaching ?? [], user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Attendance is stored against the Student document, marks against the User.
    const [attendanceRecords, markRecords] = await Promise.all([
      Attendance.find({ studentId: student._id }).select("subject status").lean<IAttendance[]>(),
      Marks.find({ studentId: id }).select("subject examType obtained max").lean<IMarks[]>(),
    ]);

    const attendance = summarizeAttendance(attendanceRecords);
    const marks = summarizeMarks(markRecords);

    const personal = student.personalDetails;
    const parent = student.parentDetails;
    const guardian = student.guardianDetails;

    return NextResponse.json({
      profile: {
        name: student.name,
        rollNo: student.rollNo,
        email: user.email ?? null,
        branch: user.branch ?? student.branch,
        year: user.year ?? null,
        section: user.section ?? student.section,
      },
      atRisk: {
        lowAttendance: attendance.lowAttendance,
        backlogCount: marks.backlogCount,
      },
      attendance,
      marks,
      contact: {
        student: { mobile: personal?.mobileNo ?? null, phone: personal?.phoneNo ?? null },
        father: {
          name: parent?.fatherName ?? null,
          mobile: parent?.fatherMobileNo ?? null,
          email: parent?.fatherEmail ?? null,
        },
        mother: {
          name: parent?.motherName ?? null,
          mobile: parent?.motherMobileNo ?? null,
          email: parent?.motherEmail ?? null,
        },
        parentPhone: parent?.phoneNo ?? null,
        guardian: {
          name: guardian?.name ?? null,
          mobile: guardian?.mobile ?? null,
          phone: guardian?.phone ?? null,
        },
      },
    });
  } catch (error) {
    console.error("teachers/students/[id] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
