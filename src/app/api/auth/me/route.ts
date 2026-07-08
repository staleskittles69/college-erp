import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";
import { getToken } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findById(payload.userId).select("-password");
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile: {
      id: string;
      email: string;
      role: string;
      studentId?: string;
      name?: string;
      rollNo?: string;
      branch?: string;
      semester?: number;
      section?: string;
    } = {
      id: currentUser._id.toString(),
      email: currentUser.email ?? "",
      role: currentUser.role,
      name: currentUser.name,
    };

    if (currentUser.role === "student" && currentUser.studentId) {
      const studentRecord = await Student.findById(currentUser.studentId);
      if (studentRecord) {
        profile.studentId = studentRecord._id.toString();
        profile.name = studentRecord.name ?? currentUser.name;
        profile.rollNo = studentRecord.rollNo;
        profile.branch = studentRecord.branch;
        profile.semester = studentRecord.semester;
        profile.section = studentRecord.section;
      }
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
