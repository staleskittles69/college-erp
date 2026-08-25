import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Teacher, { ITeacher } from "@/models/Teacher";
import Subject from "@/models/Subject";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    await connectDB();

    const teacher = await Teacher.findById(id);
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    if (body.newPassword != null) {
      const strengthError = validatePasswordStrength(body.newPassword);
      if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 });
    }

    if (body.teaching != null) teacher.teaching = body.teaching;
    if (body.name != null) teacher.name = body.name;
    if (body.department != null) teacher.department = body.department;
    await teacher.save();

    if (body.newPassword != null) {
      const hashedPassword = await hashPassword(body.newPassword);
      await User.findByIdAndUpdate(teacher.userId, {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockUntil: null,
      });
    }

    const populated = await Teacher.findById(id).populate("userId", "email").lean() as (ITeacher & { userId: { email?: string } }) | null;

    await logAudit(
      payload,
      "update",
      "Teacher",
      `Updated teacher ${teacher.name}${body.newPassword != null ? " (password reset)" : ""}`,
      teacher._id.toString()
    );

    return NextResponse.json({
      id: populated!._id.toString(),
      name: populated!.name,
      email: (populated!.userId as { email?: string })?.email ?? "",
      department: populated!.department,
      teaching: populated!.teaching ?? [],
    });
  } catch (error) {
    console.error("Teacher PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const teacher = await Teacher.findById(id);
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    await Subject.updateMany({ teacherIds: id }, { $pull: { teacherIds: id } });
    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(id);

    await logAudit(
      payload,
      "delete",
      "Teacher",
      `Deleted teacher ${teacher.name} (${teacher.department})`,
      teacher._id.toString()
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
