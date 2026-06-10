import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (payload.role !== "student") {
      return NextResponse.json({ error: "Forbidden — student only" }, { status: 403 });
    }

    await connectDB();

    const user = await User.findById(payload.userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const u = user as unknown as {
      _id: { toString: () => string };
      name: string;
      rollNumber?: number;
      branch?: string;
      year?: number;
      section?: string;
      role: string;
    };

    return NextResponse.json({
      id: u._id.toString(),
      name: u.name,
      rollNumber: u.rollNumber,
      branch: u.branch,
      year: u.year,
      section: u.section,
      role: u.role,
    });
  } catch (err) {
    console.error("student profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
