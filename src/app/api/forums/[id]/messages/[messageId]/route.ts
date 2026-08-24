import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import ForumMessage from "@/models/ForumMessage";
import { getAuth } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messageId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();
    const message = await ForumMessage.findById(messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const isOwner = message.senderUserId.toString() === payload.userId;
    const isModerator = payload.role === "teacher" || payload.role === "admin";
    if (!isOwner && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await message.deleteOne();

    if (!isOwner) {
      await logAudit(
        payload,
        "delete",
        "ForumMessage",
        `Removed a message from ${message.senderName} in a forum`,
        messageId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forum message DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
