import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student from "@/models/Student";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const student = await Student.findById(id).populate("userId", "email");
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (payload.role === "student" && payload.studentId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      _id: student._id.toString(),
      userId: (student.userId as { _id: string })?.toString(),
      email: (student.userId as { email?: string })?.email,
      name: student.name,
      rollNo: student.rollNo,
      branch: student.branch,
      semester: student.semester,
      section: student.section,
    });
  } catch (error) {
    console.error("Student GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, rollNo, branch, semester, section } = body;

    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (name != null) student.name = name;
    if (rollNo != null) student.rollNo = rollNo;
    if (branch != null) student.branch = branch;
    if (semester != null) student.semester = Number(semester);
    if (section != null) student.section = section;
    await student.save();

    return NextResponse.json({
      _id: student._id.toString(),
      name: student.name,
      rollNo: student.rollNo,
      branch: student.branch,
      semester: student.semester,
      section: student.section,
    });
  } catch (error) {
    console.error("Student PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
