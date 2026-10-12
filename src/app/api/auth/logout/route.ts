import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getToken } from "@/lib/api-auth";
import { clearAuthCookie, endSession } from "@/lib/sessions";
import { logAuthEvent } from "@/lib/authEvents";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);

  // Delete the session on the server too, so a copy of the cookie stops working.
  const token = getToken(request);
  const claims = token ? verifyToken(token) : null;
  if (claims) {
    try {
      await connectDB();
      await endSession(claims.sid);
      await logAuthEvent(request, { type: "logout", userId: claims.userId, role: claims.role });
    } catch (error) {
      console.error("Logout session cleanup failed:", error);
    }
  }

  return response;
}
