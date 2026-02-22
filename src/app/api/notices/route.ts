import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/models/Notice";
import { getAuth, requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const payload = getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const skip = parseInt(searchParams.get("skip") ?? "0", 10);

    const notices = await Notice.find()
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      notices.map((n) => ({
        _id: (n._id as { toString: () => string }).toString(),
        title: n.title,
        body: n.body,
        pinned: n.pinned,
        createdAt: n.createdAt,
      }))
    );
  } catch (err) {
    console.error("Notices GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: bodyText, pinned } = body;

    if (!title || !bodyText) {
      return NextResponse.json(
        { error: "Missing required fields: title, body" },
        { status: 400 }
      );
    }

    await connectDB();

    const notice = await Notice.create({
      title,
      body: bodyText,
      createdBy: payload.userId,
      pinned: Boolean(pinned),
    });

    return NextResponse.json({
      _id: notice._id.toString(),
      title: notice.title,
      body: notice.body,
      pinned: notice.pinned,
      createdAt: notice.createdAt,
    });
  } catch (err) {
    console.error("Notices POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
