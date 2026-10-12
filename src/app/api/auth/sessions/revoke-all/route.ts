import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getAuth } from "@/lib/api-auth";
import { endAllSessions } from "@/lib/sessions";
import { logAuthEvent } from "@/lib/authEvents";

// "Sign out of all other devices" — ends every login for this user except the current one.
export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const ended = await endAllSessions(payload.userId, payload.sid);
    await logAuthEvent(request, {
      type: "sessions_revoked",
      userId: payload.userId,
      role: payload.role,
      detail: `${ended} other session${ended === 1 ? "" : "s"} ended`,
    });

    return NextResponse.json({ ended });
  } catch (error) {
    console.error("Revoke sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
