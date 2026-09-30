import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Suggestion from "@/models/Suggestion";
import { getAuth, isSuggestionsOwner } from "@/lib/api-auth";
import { toIdString } from "@/lib/utils";

const MAX_NAME = 80;
const MAX_MESSAGE = 2000;
const MAX_PER_DAY = 10;

// Anyone logged in can send a suggestion; only the owner can read them.
export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Please write your feedback." }, { status: 400 });
    if (name.length > MAX_NAME) return NextResponse.json({ error: `Name must be ${MAX_NAME} characters or fewer.` }, { status: 400 });
    if (message.length > MAX_MESSAGE) return NextResponse.json({ error: `Feedback must be ${MAX_MESSAGE} characters or fewer.` }, { status: 400 });

    await connectDB();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Suggestion.countDocuments({ userId: payload.userId, createdAt: { $gte: since } });
    if (recent >= MAX_PER_DAY) {
      return NextResponse.json({ error: "You've sent a lot of feedback today. Please try again tomorrow." }, { status: 429 });
    }

    await Suggestion.create({ userId: payload.userId, name, role: payload.role, message });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Suggestions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    if (!(await isSuggestionsOwner(payload))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const suggestions = await Suggestion.find().sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json(
      suggestions.map((item) => ({
        _id: toIdString(item._id),
        name: item.name,
        role: item.role,
        message: item.message,
        createdAt: item.createdAt,
      }))
    );
  } catch (error) {
    console.error("Suggestions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
