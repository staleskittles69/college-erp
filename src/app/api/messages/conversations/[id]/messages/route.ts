import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Conversation, { IConversationParticipant } from "@/models/Conversation";
import Message, { IMessage } from "@/models/Message";
import Notification from "@/models/Notification";
import { getAuth, requireAdminOrTeacher } from "@/lib/api-auth";
import { containsBannedWords } from "@/lib/forumContentFilter";

const MESSAGE_LIMIT = 200;
const NOTIFICATION_PREVIEW_LENGTH = 140;

function serializeMessage(message: IMessage) {
  return {
    _id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderUserId: message.senderUserId.toString(),
    senderName: message.senderName,
    senderRole: message.senderRole,
    text: message.text,
    createdAt: message.createdAt,
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdminOrTeacher(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const conversation = await Conversation.findById(id)
      .select("participants")
      .lean<{ participants: { userId: mongoose.Types.ObjectId }[] }>();
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    const isMember = conversation.participants.some((participant) => participant.userId.toString() === payload.userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Most recent MESSAGE_LIMIT messages, returned oldest-first for chat display.
    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .limit(MESSAGE_LIMIT)
      .lean<IMessage[]>();
    messages.reverse();

    return NextResponse.json(messages.map(serializeMessage));
  } catch (error) {
    console.error("Conversation messages GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdminOrTeacher(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const trimmedText = typeof body.text === "string" ? body.text.trim() : "";
    if (!trimmedText) return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    if (trimmedText.length > 2000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }
    if (containsBannedWords(trimmedText)) {
      return NextResponse.json(
        { error: "Your message contains language that isn't allowed here. Please edit it and try again." },
        { status: 400 }
      );
    }

    await connectDB();

    const conversation = await Conversation.findById(id);
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const sender = conversation.participants.find(
      (participant: IConversationParticipant) => participant.userId.toString() === payload.userId
    );
    if (!sender) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const message = await Message.create({
      conversationId: id,
      senderUserId: payload.userId,
      senderName: sender.name,
      senderRole: payload.role,
      text: trimmedText,
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview = trimmedText;
    conversation.lastMessageSenderName = sender.name;
    sender.lastReadAt = message.createdAt;
    await conversation.save();

    const recipients = conversation.participants.filter(
      (participant: IConversationParticipant) => participant.userId.toString() !== payload.userId
    );
    if (recipients.length > 0) {
      try {
        await Notification.insertMany(
          recipients.map((recipient: IConversationParticipant) => ({
            recipientUserId: recipient.userId,
            type: "new_message",
            actorUserId: payload.userId,
            actorName: sender.name,
            conversationId: conversation._id,
            conversationName: conversation.kind === "group" ? conversation.name : undefined,
            messageId: message._id,
            messagePreview:
              trimmedText.length > NOTIFICATION_PREVIEW_LENGTH
                ? `${trimmedText.slice(0, NOTIFICATION_PREVIEW_LENGTH)}…`
                : trimmedText,
          }))
        );
      } catch (notifyError) {
        // A notification failure should never break the message send itself.
        console.error("Message notification insert failed:", notifyError);
      }
    }

    return NextResponse.json(serializeMessage(message));
  } catch (error) {
    console.error("Conversation messages POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
