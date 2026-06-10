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
      students.map((s) => {
        const u = s as unknown as {
          _id: { toString: () => string };
          name: string;
          rollNumber?: number;
          branch?: string;
          year?: number;
          section?: string;
          role: string;
        };
        return {
          id: u._id.toString(),
          name: u.name,
          rollNumber: u.rollNumber,
          branch: u.branch,
          year: u.year,
          section: u.section,
          role: u.role,
        };
      })
    );
  } catch (err) {
    console.error("admin/students GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
