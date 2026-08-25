import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Conversation, { IConversation } from "@/models/Conversation";
import User from "@/models/User";
import { getAuth, requireAdminOrTeacher } from "@/lib/api-auth";
import { getOrCreateStaffGroupConversation, buildDmParticipantKey } from "@/lib/messaging";

function serializeConversation(conversation: IConversation, meId: string) {
  const mine = conversation.participants.find((participant) => participant.userId.toString() === meId);
  const other =
    conversation.kind === "dm"
      ? conversation.participants.find((participant) => participant.userId.toString() !== meId)
      : null;

  return {
    _id: conversation._id.toString(),
    kind: conversation.kind,
    name: conversation.kind === "group" ? conversation.name ?? "All Staff" : other?.name ?? "Unknown",
    otherUserId: other?.userId?.toString() ?? null,
    otherRole: other?.role ?? null,
    participants: conversation.participants.map((participant) => ({
      userId: participant.userId.toString(),
      name: participant.name,
      role: participant.role,
    })),
    lastMessageAt: conversation.lastMessageAt,
    lastMessagePreview: conversation.lastMessagePreview ?? null,
    lastMessageSenderName: conversation.lastMessageSenderName ?? null,
    unread: mine ? new Date(conversation.lastMessageAt) > new Date(mine.lastReadAt) : false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdminOrTeacher(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    await getOrCreateStaffGroupConversation();

    const conversations = await Conversation.find({ "participants.userId": payload.userId })
      .lean<IConversation[]>();

    const serialized = conversations.map((conversation) => serializeConversation(conversation, payload.userId));
    serialized.sort((a, b) => {
      if (a.kind === "group" && b.kind !== "group") return -1;
      if (b.kind === "group" && a.kind !== "group") return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Conversations GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdminOrTeacher(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const recipientUserId = typeof body.recipientUserId === "string" ? body.recipientUserId : "";
    if (!mongoose.Types.ObjectId.isValid(recipientUserId)) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }
    if (recipientUserId === payload.userId) {
      return NextResponse.json({ error: "Cannot start a conversation with yourself" }, { status: 400 });
    }

    await connectDB();

    const [me, recipient] = await Promise.all([
      User.findById(payload.userId).select("name").lean<{ name?: string }>(),
      User.findById(recipientUserId)
        .select("name role")
        .lean<{ name?: string; role?: "admin" | "student" | "teacher" }>(),
    ]);
    if (!recipient || (recipient.role !== "admin" && recipient.role !== "teacher")) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }
    const recipientRole = recipient.role;

    const participantKey = buildDmParticipantKey(payload.userId, recipientUserId);

    let conversation = await Conversation.findOne({ participantKey });
    if (!conversation) {
      try {
        conversation = await Conversation.create({
          kind: "dm",
          participantKey,
          participants: [
            { userId: payload.userId, name: me?.name ?? "Unknown", role: payload.role, lastReadAt: new Date() },
            { userId: recipientUserId, name: recipient.name, role: recipientRole, lastReadAt: new Date(0) },
          ],
          lastMessageAt: new Date(),
        });
      } catch {
        // Race: another request created the same DM first — use theirs.
        conversation = await Conversation.findOne({ participantKey });
        if (!conversation) throw new Error("Failed to create or find conversation");
      }
    }

    return NextResponse.json(serializeConversation(conversation, payload.userId));
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
