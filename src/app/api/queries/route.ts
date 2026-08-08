import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Query from "@/models/Query";
import User from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    const filter: Record<string, unknown> = {};

    if (requireAdmin(payload)) {
      if (status === "open" || status === "resolved") filter.status = status;
      if (role === "student" || role === "teacher") filter.fromRole = role;
    } else {
      filter.fromUserId = payload.userId;
    }

    const queries = await Query.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      queries.map((query) => ({
        _id: (query._id as { toString: () => string }).toString(),
        fromName: query.fromName,
        fromRole: query.fromRole,
        subject: query.subject,
        message: query.message,
        status: query.status,
        createdAt: query.createdAt,
      }))
    );
  } catch (error) {
    console.error("Queries GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "student" && payload.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { subject, message } = body;
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(payload.userId).select("name").lean<{ name?: string }>();

    const query = await Query.create({
      fromUserId: payload.userId,
      fromName: user?.name ?? "Unknown",
      fromRole: payload.role,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
    });

    return NextResponse.json({
      _id: query._id.toString(),
      fromName: query.fromName,
      fromRole: query.fromRole,
      subject: query.subject,
      message: query.message,
      status: query.status,
      createdAt: query.createdAt,
    });
  } catch (error) {
    console.error("Queries POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
