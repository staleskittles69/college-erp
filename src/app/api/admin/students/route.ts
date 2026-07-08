import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";

// GET /api/admin/students?branch=CSE&year=1&section=A
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const year = searchParams.get("year");
    const section = searchParams.get("section");

    await connectDB();

    const filter: Record<string, unknown> = { role: "student" };
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year, 10);
    if (section) filter.section = section;

    const students = await User.find(filter)
      .select("-password")
      .sort({ rollNumber: 1 })
      .lean();

    return NextResponse.json(
      students.map((studentDoc) => {
        const student = studentDoc as unknown as {
          _id: { toString: () => string };
          name: string;
          rollNumber?: number;
          branch?: string;
          year?: number;
          section?: string;
          role: string;
        };
        return {
          id: student._id.toString(),
          name: student.name,
          rollNumber: student.rollNumber,
          branch: student.branch,
          year: student.year,
          section: student.section,
          role: student.role,
        };
      })
    );
  } catch (error) {
    console.error("admin/students GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
