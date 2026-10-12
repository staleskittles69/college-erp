import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AuthEvent, { AUTH_EVENT_TYPES } from "@/models/AuthEvent";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { toIdString } from "@/lib/utils";

const MAX_DAYS = 90; // matches the AuthEvent TTL index

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 500);
    const daysParam = searchParams.get("days");
    const typeParam = searchParams.get("type");

    const filter: Record<string, unknown> = {};
    if (daysParam) {
      const days = Math.min(Math.max(parseInt(daysParam, 10) || 1, 1), MAX_DAYS);
      filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
    if (typeParam === "problems") {
      filter.type = { $in: ["login_failed", "login_blocked"] };
    } else if (typeParam && (AUTH_EVENT_TYPES as readonly string[]).includes(typeParam)) {
      filter.type = typeParam;
    }

    await connectDB();

    const events = await AuthEvent.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json(
      events.map((event) => ({
        _id: toIdString(event._id),
        type: event.type,
        userName: event.userName ?? null,
        role: event.role ?? null,
        identifier: event.identifier ?? null,
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
        detail: event.detail ?? null,
        createdAt: event.createdAt,
      }))
    );
  } catch (error) {
    console.error("Login activity GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
