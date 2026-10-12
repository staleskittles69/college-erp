import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";
import { comparePassword, hashPassword, validatePasswordStrength } from "@/lib/auth";
import { endAllSessions, endSession, startSession } from "@/lib/sessions";
import { logAuthEvent } from "@/lib/authEvents";
import {
  checkLoginRateLimit,
  clearLoginFailures,
  clientIp,
  loginBuckets,
  recordLoginFailure,
} from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request, { allowPendingPasswordChange: true });
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json().catch(() => ({}));

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both fields are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Wrong "current password" guesses count towards the same limits as the login page,
    // so a stolen session can't be used to brute-force the real password.
    const buckets = loginBuckets(clientIp(request), user.email ?? payload.userId);
    const waitMs = await checkLoginRateLimit(buckets);
    if (waitMs > 0) {
      const minutes = Math.ceil(waitMs / 60000);
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      await recordLoginFailure(buckets);
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    await clearLoginFailures(buckets);

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "New password must be different from the current one" }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(newPassword, [user.email ?? "", user.name ?? ""]);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    user.password = await hashPassword(newPassword);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    await user.save();

    // Log out every other device, and swap this device onto a fresh session/cookie
    // (which also drops the "must change password" flag from the token).
    await endAllSessions(payload.userId, payload.sid);
    await endSession(payload.sid);
    const response = NextResponse.json({ message: "Password changed successfully" });
    await startSession(user, request, response);

    await logAuthEvent(request, {
      type: "password_changed",
      userId: payload.userId,
      userName: user.name,
      role: user.role,
    });

    return response;
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
