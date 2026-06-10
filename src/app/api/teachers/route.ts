import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Teacher from "@/models/Teacher";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const filter: Record<string, unknown> = {};
    if (department) filter.department = department;

    const teachers = await Teacher.find(filter)
      .populate("userId", "email")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(
      teachers.map((t) => ({
        id: (t._id as { toString: () => string }).toString(),
        name: t.name,
        email: (t.userId as { email?: string })?.email ?? "",
        department: t.department,
        teaching: t.teaching ?? [],
        plainPassword: t.plainPassword ?? "",
      }))
    );
  } catch (err) {
    console.error("Teachers GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, email, password, department } = body;

    if (!name || !email || !department) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, department" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const plainPassword = password || "teacher123";
    const hashedPassword = await hashPassword(plainPassword);
    const user = await User.create({ name, email, password: hashedPassword, role: "teacher" });

    const teacher = await Teacher.create({
      userId: user._id,
      name,
      employeeId: `EMP${Date.now()}`,
      department,
      teaching: [],
      plainPassword,
    });

    return NextResponse.json({
      id: teacher._id.toString(),
      name: teacher.name,
      email: user.email,
      department: teacher.department,
      teaching: [],
      plainPassword,
    });
  } catch (err) {
    console.error("Teachers POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
