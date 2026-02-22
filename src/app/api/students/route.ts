import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student from "@/models/Student";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");

    const filter: Record<string, unknown> = {};
    if (branch) filter.branch = branch;
    if (semester) filter.semester = parseInt(semester, 10);

    const students = await Student.find(filter)
      .populate("userId", "email")
      .sort({ rollNo: 1 })
      .lean();

    const result = students.map((s) => ({
      _id: s._id.toString(),
      userId: (s.userId as { _id: string; email: string })?._id?.toString(),
      email: (s.userId as { email?: string })?.email,
      name: s.name,
      rollNo: s.rollNo,
      branch: s.branch,
      semester: s.semester,
      section: s.section,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Students GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, rollNo, branch, semester, section } = body;

    if (!email || !password || !name || !rollNo || !branch || semester == null || !section) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name, rollNo, branch, semester, section" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: "student",
    });

    const student = await Student.create({
      userId: user._id,
      name,
      rollNo,
      branch,
      semester: Number(semester),
      section,
    });

    await User.findByIdAndUpdate(user._id, { studentId: student._id });

    return NextResponse.json({
      _id: student._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      name: student.name,
      rollNo: student.rollNo,
      branch: student.branch,
      semester: student.semester,
      section: student.section,
    });
  } catch (err) {
    console.error("Students POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
