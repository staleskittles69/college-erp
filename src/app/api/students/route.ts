import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student from "@/models/Student";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (payload.role !== "admin" && payload.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const year = searchParams.get("year");
    const section = searchParams.get("section");

    const search = searchParams.get("search");

    const filter: Record<string, unknown> = { role: "student" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    } else {
      if (branch) filter.branch = branch;
      if (section) filter.section = section;
      if (year) filter.year = parseInt(year, 10);
      else if (semester) filter.year = Math.ceil(parseInt(semester, 10) / 2);
    }

    const students = await User.find(filter)
      .select("-password")
      .sort({ rollNumber: 1 })
      .limit(search ? 10 : 0)
      .lean();

    const result = students.map((s) => ({
      _id: (s._id as { toString: () => string }).toString(),
      name: s.name,
      rollNo: s.rollNumber != null ? String(s.rollNumber) : "",
      email: s.email,
      branch: s.branch,
      year: s.year,
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
    const payload = await getAuth(request);
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
