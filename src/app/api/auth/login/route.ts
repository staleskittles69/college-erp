import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { signToken, comparePassword } from "@/lib/auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        user.failedLoginAttempts = 0;
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      } else {
        user.failedLoginAttempts = attempts;
      }
      await user.save();
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const token = signToken({
      userId: user._id.toString(),
      role: user.role as "admin" | "student" | "teacher",
      rollNumber: user.rollNumber,
    });

    const response = NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
