import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { getAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const logs = await AuditLog.find({ actorId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json(
      logs.map((log) => ({
        _id: (log._id as { toString: () => string }).toString(),
        action: log.action,
        entityType: log.entityType,
        description: log.description,
        createdAt: log.createdAt,
      }))
    );
  } catch (error) {
    console.error("Teacher activity GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
