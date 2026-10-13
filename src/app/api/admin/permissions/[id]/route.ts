import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import StudentPermission, { IStudentPermission } from "@/models/StudentPermission";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { COLLEGE_TIME_ZONE } from "@/lib/utils";

// DELETE /api/admin/permissions/[id] — remove a campus exit that was logged by mistake
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const permission = await StudentPermission.findByIdAndDelete(id).lean<IStudentPermission>();
    if (!permission) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const grantedAt = permission.createdAt.toLocaleString("en-IN", {
      timeZone: COLLEGE_TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    await logAudit(
      payload,
      "delete",
      "StudentPermission",
      `Removed campus exit for ${permission.studentName} (${permission.rollNo}) logged at ${grantedAt}`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin/permissions DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
