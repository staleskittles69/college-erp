import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Test from "@/models/Test";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { deleteUploadIfUnused } from "@/lib/uploadCleanup";

export async function DELETE(request: NextRequest, context: { params: Promise<{ seriesId: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { seriesId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(seriesId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const attachments = await Test.find({ seriesId, attachmentUrl: { $ne: null } })
      .select("attachmentUrl createdBy")
      .lean<{ attachmentUrl: string; createdBy?: mongoose.Types.ObjectId }[]>();
    const result = await Test.deleteMany({ seriesId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }
    for (const { attachmentUrl, createdBy } of attachments) {
      if (createdBy) await deleteUploadIfUnused(attachmentUrl, createdBy.toString());
    }

    await logAudit(payload, "delete", "Test", `Deleted test series (${result.deletedCount} tests)`, seriesId);

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Test series DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
