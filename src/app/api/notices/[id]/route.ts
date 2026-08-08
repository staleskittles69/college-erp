import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/models/Notice";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import mongoose from "mongoose";

/* ========================= PATCH ========================= */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  try {
    const payload = await getAuth(request);

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { title, body: bodyText, pinned } = body;

    await connectDB();

    const notice = await Notice.findById(id);

    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    if (title !== undefined) notice.title = title;
    if (bodyText !== undefined) notice.body = bodyText;
    if (pinned !== undefined) notice.pinned = Boolean(pinned);

    await notice.save();

    await logAudit(
      payload,
      "update",
      "Notice",
      `Updated notice "${notice.title}"`,
      notice._id.toString()
    );

    return NextResponse.json({
      _id: notice._id.toString(),
      title: notice.title,
      body: notice.body,
      pinned: notice.pinned,
      createdAt: notice.createdAt,
    });

  } catch (error) {
    console.error("Notice PATCH error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ========================= DELETE ========================= */

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  try {
    const payload = await getAuth(request);

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const deleted = await Notice.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    await logAudit(
      payload,
      "delete",
      "Notice",
      `Deleted notice "${deleted.title}"`,
      deleted._id.toString()
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Notice DELETE error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

