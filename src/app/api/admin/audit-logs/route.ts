import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { getAuth, requireAdmin } from "@/lib/api-auth";

const MAX_DAYS = 90; // matches the AuditLog TTL index — logs older than this don't exist

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10) || 10, 500);
    const daysParam = searchParams.get("days");

    const filter: Record<string, unknown> = {};
    if (daysParam) {
      const days = Math.min(Math.max(parseInt(daysParam, 10) || 1, 1), MAX_DAYS);
      filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    await connectDB();

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      logs.map((log) => ({
        _id: (log._id as { toString: () => string }).toString(),
        actorName: log.actorName,
        actorRole: log.actorRole,
        action: log.action,
        entityType: log.entityType,
        description: log.description,
        createdAt: log.createdAt,
      }))
    );
  } catch (error) {
    console.error("Audit logs GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
