import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { generateRollNumber } from "@/lib/utils/generateRollNumber";

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { name, branch, year, section, password } = body;

    if (!name || !branch || !year || !section || !password) {
      return NextResponse.json(
        { error: "name, branch, year, section, password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const rollNumber = await generateRollNumber();

    const student = await User.create({
      name,
      rollNumber,
      branch,
      year: Number(year),
      section,
      password,
      role: "student",
    });

    return NextResponse.json(
      {
        id: student._id.toString(),
        name: student.name,
        rollNumber: student.rollNumber,
        branch: student.branch,
        year: student.year,
        section: student.section,
        role: student.role,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create-student error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
