import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request, { allowPendingPasswordChange: true });
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findById(payload.userId).select("email role name mustChangePassword");
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = {
      id: currentUser._id.toString(),
      email: currentUser.email ?? "",
      role: currentUser.role,
      name: currentUser.name,
      mustChangePassword: Boolean(currentUser.mustChangePassword),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
