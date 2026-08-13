import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Notice from "@/models/Notice";
import { getAuth } from "@/lib/api-auth";
import { BRANCHES } from "@/lib/academics";

const BRANCH_LABELS: Record<string, string> = {
  CSE: "Computer Science & Engineering",
  ECE: "Electronics & Communication",
  ME:  "Mechanical Engineering",
  CE:  "Civil Engineering",
  EEE: "Electrical & Electronics Engineering",
};

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const [totalStudents, branchCounts, noticeCount] = await Promise.all([
      Student.countDocuments(),
      Student.aggregate([{ $group: { _id: "$branch", count: { $sum: 1 } } }]),
      Notice.countDocuments(),
    ]);

    const branches = branchCounts
      .map((branchCount) => ({
        slug: branchCount._id.toLowerCase(),
        name: branchCount._id,
        label: BRANCH_LABELS[branchCount._id] ?? branchCount._id,
        students: branchCount.count,
      }))
      .sort((a, b) => BRANCHES.indexOf(a.name) - BRANCHES.indexOf(b.name));

    return NextResponse.json({
      totalStudents,
      totalBranches: branches.length,
      noticeCount,
      branches,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
