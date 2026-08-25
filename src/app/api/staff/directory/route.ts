import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth, requireAdminOrTeacher } from "@/lib/api-auth";
import { toIdString } from "@/lib/utils";

// Staff-wide lookup (admin + teacher, excluding the caller) for the "new conversation"
// picker. Kept separate from /api/teachers/directory, which is Teacher-collection-only
// and feeds forum @mentions (intentionally teacher-only there).
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdminOrTeacher(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const staff = await User.find({ role: { $in: ["admin", "teacher"] }, _id: { $ne: payload.userId } })
      .select("name role")
      .sort({ name: 1 })
      .lean<{ _id: unknown; name: string; role: "admin" | "teacher" }[]>();

    return NextResponse.json(
      staff.map((user) => ({ userId: toIdString(user._id), name: user.name, role: user.role }))
    );
  } catch (error) {
    console.error("Staff directory GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
