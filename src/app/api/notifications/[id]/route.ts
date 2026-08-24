import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { getAuth } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const notification = await Notification.findOne({ _id: id, recipientUserId: payload.userId });
    if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    notification.read = true;
    await notification.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
