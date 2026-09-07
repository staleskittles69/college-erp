import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notice from "@/models/Notice";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const skip = parseInt(searchParams.get("skip") ?? "0", 10);

    let filter: Record<string, unknown> = {};
    if (payload.role === "student") {
      const User = (await import("@/models/User")).default;
      const user = await User.findById(payload.userId).lean() as { branch?: string; year?: number } | null;
      filter = { audience: { $ne: "teachers" } };
      if (user?.branch && user?.year) {
        filter.$or = [
          { targetBranch: null, targetYear: null },
          { targetBranch: user.branch, targetYear: null },
          { targetBranch: null, targetYear: user.year },
          { targetBranch: user.branch, targetYear: user.year },
        ];
      }
    }

    const notices = await Notice.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      notices.map((notice) => ({
        _id: String(notice._id),
        title: notice.title,
        body: notice.body,
        pinned: notice.pinned,
        audience: notice.audience ?? "students",
        targetBranch: notice.targetBranch ?? null,
        targetYear: notice.targetYear ?? null,
        createdAt: notice.createdAt,
      }))
    );
  } catch (error) {
    console.error("Notices GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (payload.role !== "teacher" && !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: bodyText, pinned, audience, targetBranch, targetYear } = body;

    if (!title || !bodyText) {
      return NextResponse.json(
        { error: "Missing required fields: title, body" },
        { status: 400 }
      );
    }

    const validAudiences = ["students", "teachers", "both"];
    const noticeAudience = validAudiences.includes(audience) ? audience : "students";
    const isTeachersOnly = noticeAudience === "teachers";

    await connectDB();

    const notice = await Notice.create({
      title,
      body: bodyText,
      createdBy: payload.userId,
      pinned: payload.role === "admin" ? Boolean(pinned) : false,
      audience: noticeAudience,
      targetBranch: isTeachersOnly ? null : (targetBranch ?? null),
      targetYear: isTeachersOnly ? null : (targetYear ? Number(targetYear) : null),
    });

    await logAudit(
      payload,
      "create",
      "Notice",
      `Created notice "${notice.title}"`,
      notice._id.toString()
    );

    return NextResponse.json({
      _id: notice._id.toString(),
      title: notice.title,
      body: notice.body,
      pinned: notice.pinned,
      audience: notice.audience,
      targetBranch: notice.targetBranch ?? null,
      targetYear: notice.targetYear ?? null,
      createdAt: notice.createdAt,
    });
  } catch (error) {
    console.error("Notices POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
