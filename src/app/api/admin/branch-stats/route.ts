import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import { getAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "admin" && payload.role !== "teacher")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const branchSectionCounts = await Student.aggregate([
    { $group: { _id: { branch: "$branch", section: "$section" } } },
    { $group: { _id: "$_id.branch", sections: { $sum: 1 } } },
  ]);

  const sectionCountByBranch: Record<string, number> = {};
  branchSectionCounts.forEach((entry) => {
    if (entry._id) sectionCountByBranch[entry._id.toLowerCase()] = entry.sections;
  });

  return NextResponse.json(sectionCountByBranch);
}
