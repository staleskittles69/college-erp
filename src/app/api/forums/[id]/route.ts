import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Forum, { IForum } from "@/models/Forum";
import ForumMessage from "@/models/ForumMessage";
import { getAuth } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

function canRenameForum(forum: IForum, userId: string, role: string) {
  return role === "admin" || forum.createdByUserId.toString() === userId;
}

function canDeleteForum(forum: IForum, userId: string, role: string) {
  return role === "admin" || role === "teacher" || forum.createdByUserId.toString() === userId;
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
    const forum = await Forum.findById(id).lean<IForum>();
    if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });

    return NextResponse.json({
      _id: forum._id.toString(),
      name: forum.name,
      category: forum.category,
      createdByUserId: forum.createdByUserId.toString(),
      createdByName: forum.createdByName,
      createdAt: forum.createdAt,
    });
  } catch (error) {
    console.error("Forum GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const trimmedName = typeof body.name === "string" ? body.name.trim() : "";
    if (!trimmedName) return NextResponse.json({ error: "Forum name is required" }, { status: 400 });
    if (trimmedName.length > 60) {
      return NextResponse.json({ error: "Forum name must be 60 characters or fewer" }, { status: 400 });
    }

    await connectDB();
    const forum = await Forum.findById(id);
    if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });

    if (!canRenameForum(forum, payload.userId, payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    forum.name = trimmedName;
    await forum.save();

    await logAudit(payload, "update", "Forum", `Renamed forum to "${trimmedName}"`, forum._id.toString());

    return NextResponse.json({
      _id: forum._id.toString(),
      name: forum.name,
      category: forum.category,
      createdByUserId: forum.createdByUserId.toString(),
      createdByName: forum.createdByName,
      createdAt: forum.createdAt,
    });
  } catch (error) {
    console.error("Forum PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();
    const forum = await Forum.findById(id);
    if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });

    if (!canDeleteForum(forum, payload.userId, payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ForumMessage.deleteMany({ forumId: forum._id });
    await forum.deleteOne();

    await logAudit(payload, "delete", "Forum", `Deleted forum "${forum.name}"`, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forum DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
