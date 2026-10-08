import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LeaveRequest, { ILeaveRequest } from "@/models/LeaveRequest";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { serializeLeave } from "@/lib/leaveSchedule";

// GET /api/admin/leave?status=pending|approved|rejected — leave requests, pending first then newest
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const status = new URL(request.url).searchParams.get("status");
    const filter = status === "pending" || status === "approved" || status === "rejected" ? { status } : {};

    const requests = await LeaveRequest.find(filter).sort({ createdAt: -1 }).limit(200).lean<ILeaveRequest[]>();
    const rank = (leave: ILeaveRequest) => (leave.status === "pending" ? 0 : 1);

    return NextResponse.json(
      requests
        .sort((a, b) => rank(a) - rank(b))
        .map((leave) => ({ ...serializeLeave(leave), department: leave.department }))
    );
  } catch (error) {
    console.error("admin/leave GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
