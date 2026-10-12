import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { comparePassword, compareAgainstDummy, hashPassword, needsRehash } from "@/lib/auth";
import { startSession } from "@/lib/sessions";
import { logAuthEvent } from "@/lib/authEvents";
import {
  checkLoginRateLimit,
  clearLoginFailures,
  clientIp,
  loginBuckets,
  recordLoginFailure,
} from "@/lib/rateLimit";

const INVALID_CREDENTIALS = "Invalid roll number/email or password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body as { email?: unknown; password?: unknown };

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return NextResponse.json({ error: "Roll number/email and password are required" }, { status: 400 });
    }
    if (email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    await connectDB();

    // Students log in with a bare roll number (e.g. 25CSE00001); staff use their
    // full name@college.edu. Anything without "@" is treated as a roll number.
    const identifier = email.trim().toLowerCase();
    const lookupEmail = identifier.includes("@") ? identifier : `${identifier}@college.edu`;

    const buckets = loginBuckets(clientIp(request), lookupEmail);
    const waitMs = await checkLoginRateLimit(buckets);
    if (waitMs > 0) {
      const minutes = Math.ceil(waitMs / 60000);
      await logAuthEvent(request, { type: "login_blocked", identifier: lookupEmail });
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(waitMs / 1000)) } }
      );
    }

    const user = await User.findOne({ email: lookupEmail });

    // Unknown accounts still pay for a bcrypt compare, so timing doesn't reveal which exist.
    const passwordMatch = user?.password
      ? await comparePassword(password, user.password)
      : await compareAgainstDummy(password);

    if (!user || !passwordMatch) {
      await recordLoginFailure(buckets);
      await logAuthEvent(request, {
        type: "login_failed",
        identifier: lookupEmail,
        userId: user?._id.toString(),
        userName: user?.name,
        role: user?.role,
      });
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    await clearLoginFailures(buckets);

    if (needsRehash(user.password)) {
      user.password = await hashPassword(password);
      await user.save();
    }

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
      mustChangePassword: Boolean(user.mustChangePassword),
    });

    await startSession(user, request, response);
    await logAuthEvent(request, { type: "login", userId: user._id.toString(), userName: user.name, role: user.role });
    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
