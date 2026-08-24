import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher from "@/models/Teacher";
import { getAuth } from "@/lib/api-auth";

// Unscoped teacher lookup (name + id only) for the forum @mention autocomplete — any
// authenticated user may look up any teacher, since any teacher can already join and
// moderate any forum.
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const teachers = await Teacher.find({})
      .select("name userId")
      .sort({ name: 1 })
      .lean<{ userId: { toString: () => string }; name: string }[]>();

    return NextResponse.json(
      teachers.map((teacher) => ({ userId: teacher.userId.toString(), name: teacher.name }))
    );
  } catch (error) {
    console.error("Teacher directory GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
