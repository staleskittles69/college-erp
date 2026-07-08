import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";
import { comparePassword, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both fields are required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isMatch = user.password.startsWith("$2")
    ? await comparePassword(currentPassword, user.password)
    : user.password === currentPassword;

  if (!isMatch) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  return NextResponse.json({ message: "Password changed successfully" });
}
