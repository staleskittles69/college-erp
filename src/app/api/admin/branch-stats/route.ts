import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import { getAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const rows = await Student.aggregate([
    { $group: { _id: { branch: "$branch", section: "$section" } } },
    { $group: { _id: "$_id.branch", sections: { $sum: 1 } } },
  ]);

  const map: Record<string, number> = {};
  rows.forEach((r) => { if (r._id) map[r._id.toLowerCase()] = r.sections; });

  return NextResponse.json(map);
}
