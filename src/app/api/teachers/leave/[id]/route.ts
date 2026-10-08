import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import LeaveRequest from "@/models/LeaveRequest";
import { getAuth } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

// DELETE /api/teachers/leave/[id] — withdraw one of my own requests that hasn't been decided yet
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const leave = await LeaveRequest.findById(id);
    if (!leave || leave.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }
    if (leave.status !== "pending") {
      return NextResponse.json({ error: "Only a pending request can be withdrawn." }, { status: 409 });
    }

    await leave.deleteOne();

    await logAudit(payload, "delete", "Leave", `Withdrew leave request`, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("teachers/leave DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
