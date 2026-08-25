import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Conversation from "@/models/Conversation";
import { getAuth, requireAdminOrTeacher } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdminOrTeacher(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const result = await Conversation.updateOne(
      { _id: id, "participants.userId": payload.userId },
      { $set: { "participants.$.lastReadAt": new Date() } }
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Conversation read PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
