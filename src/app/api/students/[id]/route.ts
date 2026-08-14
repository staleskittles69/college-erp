import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student from "@/models/Student";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
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

    const student = await Student.findOne({ userId: id }).populate("userId", "email");
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (payload.role === "student" && payload.userId !== id) {
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
      personalDetails: student.personalDetails ?? {},
      educationDetails: student.educationDetails ?? [],
      parentDetails: student.parentDetails ?? {},
      guardianDetails: student.guardianDetails ?? {},
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
    const { name, rollNo, branch, semester, section, personalDetails, educationDetails, parentDetails, guardianDetails, newPassword } = body;

    if (newPassword != null) {
      const strengthError = validatePasswordStrength(newPassword);
      if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 });
    }

    await connectDB();

    const student = await Student.findOne({ userId: id });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (name != null) student.name = name;
    if (rollNo != null) student.rollNo = rollNo;
    if (branch != null) student.branch = branch;
    if (semester != null) student.semester = Number(semester);
    if (section != null) student.section = section;
    if (personalDetails != null) student.personalDetails = personalDetails;
    if (educationDetails != null) student.educationDetails = educationDetails;
    if (parentDetails != null) student.parentDetails = parentDetails;
    if (guardianDetails != null) student.guardianDetails = guardianDetails;
    await student.save();

    if (newPassword != null) {
      const hashedPassword = await hashPassword(newPassword);
      await User.findByIdAndUpdate(id, {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockUntil: null,
      });
    }

    await logAudit(
      payload,
      "update",
      "Student",
      `Updated student ${student.name} (${student.branch} sem ${student.semester}, roll ${student.rollNo})${newPassword != null ? " (password reset)" : ""}`,
      student._id.toString()
    );

    return NextResponse.json({
      _id: student._id.toString(),
      name: student.name,
      rollNo: student.rollNo,
      branch: student.branch,
      semester: student.semester,
      section: student.section,
      personalDetails: student.personalDetails ?? {},
      educationDetails: student.educationDetails ?? [],
      parentDetails: student.parentDetails ?? {},
      guardianDetails: student.guardianDetails ?? {},
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

    const student = await Student.findOne({ userId: id });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await User.findByIdAndDelete(id);
    await Student.findByIdAndDelete(student._id);

    await logAudit(
      payload,
      "delete",
      "Student",
      `Deleted student ${student.name} (${student.branch} sem ${student.semester}, roll ${student.rollNo})`,
      student._id.toString()
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
