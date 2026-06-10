import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("token");
  if (cookie?.value) return cookie.value;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

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

    const user = await User.findById(payload.userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result: {
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
      id: user._id.toString(),
      email: user.email ?? "",
      role: user.role,
      name: user.name,
    };

    if (user.role === "student" && user.studentId) {
      const student = await Student.findById(user.studentId);
      if (student) {
        result.studentId = student._id.toString();
        result.name = student.name ?? user.name;
        result.rollNo = student.rollNo;
        result.branch = student.branch;
        result.semester = student.semester;
        result.section = student.section;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
