import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Query from "@/models/Query";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;
    if (status !== "open" && status !== "resolved") {
      return NextResponse.json({ error: "status must be 'open' or 'resolved'" }, { status: 400 });
    }

    await connectDB();

    const existing = await Query.findById(id).select("toRole toUserId").lean<{
      toRole: "admin" | "teacher";
      toUserId?: mongoose.Types.ObjectId;
    }>();
    if (!existing) return NextResponse.json({ error: "Query not found" }, { status: 404 });

    const isRecipientTeacher =
      payload.role === "teacher" &&
      existing.toRole === "teacher" &&
      existing.toUserId?.toString() === payload.userId;

    if (!requireAdmin(payload) && !isRecipientTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query = await Query.findByIdAndUpdate(id, { status }, { new: true });
    if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });

    await logAudit(
      payload,
      "update",
      "Query",
      `Marked query "${query.subject}" from ${query.fromName} as ${status}`,
      query._id.toString()
    );

    return NextResponse.json({
      _id: query._id.toString(),
      fromName: query.fromName,
      fromRole: query.fromRole,
      toRole: query.toRole,
      toName: query.toName,
      subject: query.subject,
      message: query.message,
      status: query.status,
      createdAt: query.createdAt,
    });
  } catch (error) {
    console.error("Query PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
