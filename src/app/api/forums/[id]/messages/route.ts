import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Forum from "@/models/Forum";
import ForumMessage, { IForumMessage } from "@/models/ForumMessage";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";
import { containsBannedWords } from "@/lib/forumContentFilter";

const MESSAGE_LIMIT = 200;
const MENTION_PREVIEW_LENGTH = 140;

function serializeMessage(message: IForumMessage) {
  return {
    _id: message._id.toString(),
    forumId: message.forumId.toString(),
    senderUserId: message.senderUserId.toString(),
    senderName: message.senderName,
    senderRole: message.senderRole,
    text: message.text,
    mentions: (message.mentions ?? []).map((mention) => ({
      userId: mention.userId.toString(),
      name: mention.name,
    })),
    createdAt: message.createdAt,
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    // Most recent MESSAGE_LIMIT messages, returned oldest-first for chat display.
    const messages = await ForumMessage.find({ forumId: id })
      .sort({ createdAt: -1 })
      .limit(MESSAGE_LIMIT)
      .lean<IForumMessage[]>();
    messages.reverse();

    return NextResponse.json(messages.map(serializeMessage));
  } catch (error) {
    console.error("Forum messages GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "student" && payload.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const forum = await Forum.findById(id)
      .select("_id name")
      .lean<{ _id: mongoose.Types.ObjectId; name: string }>();
    if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });

    const user = await User.findById(payload.userId).select("name").lean<{ name?: string }>();

    // Only students can mention teachers. Never trust the client's id list beyond using it
    // as candidate ids — re-resolve against real teacher accounts server-side.
    let mentions: { userId: mongoose.Types.ObjectId; name: string }[] = [];
    if (payload.role === "student" && Array.isArray(body.mentionedUserIds)) {
      const validIds = [
        ...new Set(
          body.mentionedUserIds.filter(
            (value: unknown): value is string => typeof value === "string" && mongoose.Types.ObjectId.isValid(value)
          )
        ),
      ];
      if (validIds.length > 0) {
        const mentionedTeachers = await User.find({ _id: { $in: validIds }, role: "teacher" })
          .select("name")
          .lean<{ _id: mongoose.Types.ObjectId; name: string }[]>();
        mentions = mentionedTeachers.map((teacher) => ({ userId: teacher._id, name: teacher.name }));
      }
    }

    const message = await ForumMessage.create({
      forumId: id,
      senderUserId: payload.userId,
      senderName: user?.name ?? "Unknown",
      senderRole: payload.role,
      text: trimmedText,
      mentions,
    });

    if (mentions.length > 0) {
      try {
        await Notification.insertMany(
          mentions.map((mention) => ({
            recipientUserId: mention.userId,
            type: "forum_mention",
            actorUserId: payload.userId,
            actorName: user?.name ?? "Unknown",
            forumId: forum._id,
            forumName: forum.name,
            messageId: message._id,
            messagePreview:
              trimmedText.length > MENTION_PREVIEW_LENGTH
                ? `${trimmedText.slice(0, MENTION_PREVIEW_LENGTH)}…`
                : trimmedText,
          }))
        );
      } catch (notifyError) {
        // A notification failure should never break the message send itself.
        console.error("Forum mention notification insert failed:", notifyError);
      }
    }

    return NextResponse.json(serializeMessage(message));
  } catch (error) {
    console.error("Forum messages POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
