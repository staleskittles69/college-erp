import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import StudentPermission, { IStudentPermission, PERMISSION_REASON_MAX_LENGTH } from "@/models/StudentPermission";
import Student, { IStudent } from "@/models/Student";
import User, { IUser } from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { collegeDayStart } from "@/lib/utils";

// A second grant for the same student this soon is almost certainly a double click, not a second exit.
const DUPLICATE_WINDOW_MS = 60 * 1000;

function serialize(permission: IStudentPermission) {
  return {
    _id: permission._id.toString(),
    userId: permission.userId.toString(),
    rollNo: permission.rollNo,
    studentName: permission.studentName,
    reason: permission.reason,
    grantedByName: permission.grantedByName,
    grantedAt: permission.createdAt.toISOString(),
  };
}

// GET /api/admin/permissions?studentId=<User id> — that student's campus exits, newest first, with counts.
// GET /api/admin/permissions — every exit granted today (college time), newest first.
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const studentId = new URL(request.url).searchParams.get("studentId");
    const todayStart = collegeDayStart();

    if (!studentId) {
      const permissions = await StudentPermission.find({ createdAt: { $gte: todayStart } })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean<IStudentPermission[]>();
      return NextResponse.json({ permissions: permissions.map(serialize) });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [total, today, permissions] = await Promise.all([
      StudentPermission.countDocuments({ userId: studentId }),
      StudentPermission.countDocuments({ userId: studentId, createdAt: { $gte: todayStart } }),
      StudentPermission.find({ userId: studentId }).sort({ createdAt: -1 }).limit(500).lean<IStudentPermission[]>(),
    ]);

    return NextResponse.json({ total, today, permissions: permissions.map(serialize) });
  } catch (error) {
    console.error("admin/permissions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/permissions { studentId, reason? } — log that this student may leave campus now.
export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const studentId = body?.studentId;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (typeof studentId !== "string" || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Invalid student" }, { status: 400 });
    }
    if (reason.length > PERMISSION_REASON_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Reason must be ${PERMISSION_REASON_MAX_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    await connectDB();

    const [user, student, admin] = await Promise.all([
      User.findOne({ _id: studentId, role: "student" }).select("name").lean<Pick<IUser, "name">>(),
      Student.findOne({ userId: studentId }).select("rollNo").lean<Pick<IStudent, "rollNo">>(),
      User.findById(payload.userId).select("name").lean<Pick<IUser, "name">>(),
    ]);
    if (!user || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const recent = await StudentPermission.exists({
      userId: studentId,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    });
    if (recent) {
      return NextResponse.json({ error: "Already logged for this student a moment ago." }, { status: 409 });
    }

    const permission = await StudentPermission.create({
      userId: studentId,
      rollNo: student.rollNo,
      studentName: user.name,
      reason,
      grantedBy: payload.userId,
      grantedByName: admin?.name ?? "Admin",
    });
    const total = await StudentPermission.countDocuments({ userId: studentId });

    await logAudit(
      payload,
      "create",
      "StudentPermission",
      `Granted campus exit to ${user.name} (${student.rollNo})${reason ? `: ${reason}` : ""}`,
      permission._id.toString()
    );

    return NextResponse.json({ permission: serialize(permission.toObject()), total }, { status: 201 });
  } catch (error) {
    console.error("admin/permissions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
