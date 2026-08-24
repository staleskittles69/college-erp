import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Forum, { IForum } from "@/models/Forum";
import ForumMessage from "@/models/ForumMessage";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";
import { isForumCategory } from "@/lib/forumCategories";

function serializeForum(forum: IForum) {
  return {
    _id: forum._id.toString(),
    name: forum.name,
    category: forum.category,
    createdByUserId: forum.createdByUserId.toString(),
    createdByName: forum.createdByName,
    createdAt: forum.createdAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = {};
    if (isForumCategory(category)) filter.category = category;

    const forums = await Forum.find(filter).sort({ createdAt: -1 }).lean<IForum[]>();

    const enriched = await Promise.all(
      forums.map(async (forum) => {
        const [messageCount, lastMessage] = await Promise.all([
          ForumMessage.countDocuments({ forumId: forum._id }),
          ForumMessage.findOne({ forumId: forum._id })
            .sort({ createdAt: -1 })
            .select("text senderName createdAt")
            .lean<{ text: string; senderName: string; createdAt: Date }>(),
        ]);

        return {
          ...serializeForum(forum),
          messageCount,
          lastActivityAt: lastMessage?.createdAt ?? forum.createdAt,
          lastMessagePreview: lastMessage?.text ?? null,
          lastMessageSenderName: lastMessage?.senderName ?? null,
        };
      })
    );

    enriched.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Forums GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "student") {
      return NextResponse.json({ error: "Only students can create forums" }, { status: 403 });
    }

    const body = await request.json();
    const { name, category } = body;
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return NextResponse.json({ error: "Forum name is required" }, { status: 400 });
    }
    if (trimmedName.length > 60) {
      return NextResponse.json({ error: "Forum name must be 60 characters or fewer" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(payload.userId).select("name").lean<{ name?: string }>();

    const forum = await Forum.create({
      name: trimmedName,
      category: isForumCategory(category) ? category : "General",
      createdByUserId: payload.userId,
      createdByName: user?.name ?? "Unknown",
    });

    return NextResponse.json({
      ...serializeForum(forum),
      messageCount: 0,
      lastActivityAt: forum.createdAt,
      lastMessagePreview: null,
      lastMessageSenderName: null,
    });
  } catch (error) {
    console.error("Forums POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
