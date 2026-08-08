import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subject from "@/models/Subject";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import mongoose from "mongoose";

type PopulatedTeacher = { _id: mongoose.Types.ObjectId; name: string; userId?: { email?: string } };

function serialize(subject: { _id: mongoose.Types.ObjectId; name: string; department: string; teacherIds: PopulatedTeacher[] }) {
  return {
    id: subject._id.toString(),
    name: subject.name,
    department: subject.department,
    teachers: subject.teacherIds.map((teacher) => ({
      id: teacher._id.toString(),
      name: teacher.name,
      email: teacher.userId?.email ?? "",
    })),
  };
}

export async function GET(
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

    const subject = await Subject.findById(id)
      .populate({ path: "teacherIds", select: "name userId", populate: { path: "userId", select: "email" } })
      .lean();

    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    return NextResponse.json(serialize(subject as never));
  } catch (error) {
    console.error("Subject GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { addTeacherId, removeTeacherId } = body;
    if (
      (!addTeacherId && !removeTeacherId) ||
      (addTeacherId && !mongoose.Types.ObjectId.isValid(addTeacherId)) ||
      (removeTeacherId && !mongoose.Types.ObjectId.isValid(removeTeacherId))
    ) {
      return NextResponse.json({ error: "A valid addTeacherId or removeTeacherId is required" }, { status: 400 });
    }

    await connectDB();

    const subject = await Subject.findById(id);
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const Teacher = (await import("@/models/Teacher")).default;

    if (addTeacherId) {
      const alreadyAssigned = subject.teacherIds.some((teacherId: mongoose.Types.ObjectId) => teacherId.toString() === addTeacherId);
      if (!alreadyAssigned) {
        subject.teacherIds.push(new mongoose.Types.ObjectId(addTeacherId));
        await subject.save();
        const teacher = await Teacher.findById(addTeacherId).select("name").lean<{ name?: string }>();
        await logAudit(
          payload,
          "update",
          "Subject",
          `Assigned ${teacher?.name ?? "a teacher"} to "${subject.name}" (${subject.department})`,
          subject._id.toString()
        );
      }
    }

    if (removeTeacherId) {
      const stillPresent = subject.teacherIds.some((teacherId: mongoose.Types.ObjectId) => teacherId.toString() === removeTeacherId);
      if (stillPresent) {
        subject.teacherIds = subject.teacherIds.filter((teacherId: mongoose.Types.ObjectId) => teacherId.toString() !== removeTeacherId);
        await subject.save();
        const teacher = await Teacher.findById(removeTeacherId).select("name").lean<{ name?: string }>();
        await logAudit(
          payload,
          "update",
          "Subject",
          `Removed ${teacher?.name ?? "a teacher"} from "${subject.name}" (${subject.department})`,
          subject._id.toString()
        );
      }
    }

    const populated = await Subject.findById(id)
      .populate({ path: "teacherIds", select: "name userId", populate: { path: "userId", select: "email" } })
      .lean();

    return NextResponse.json(serialize(populated as never));
  } catch (error) {
    console.error("Subject PATCH error:", error);
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

    const deleted = await Subject.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    await logAudit(payload, "delete", "Subject", `Deleted subject "${deleted.name}" (${deleted.department})`, deleted._id.toString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subject DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
