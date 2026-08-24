import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { LOW_ATTENDANCE_THRESHOLD_PCT } from "@/lib/academics";

interface LowAttendanceRow {
  studentId: string;
  name: string;
  rollNo: string;
  branch: string;
  year: number;
  section: string;
  present: number;
  total: number;
  pct: number;
}

// GET /api/admin/at-risk/attendance — students with overall attendance below the threshold, worst first
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const rows = await Attendance.aggregate<LowAttendanceRow>([
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          pct: { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
        },
      },
      { $match: { pct: { $lt: LOW_ATTENDANCE_THRESHOLD_PCT } } },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "studentDoc",
        },
      },
      { $unwind: "$studentDoc" },
      {
        $lookup: {
          from: "users",
          localField: "studentDoc.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $match: { user: { $ne: null } } },
      {
        $project: {
          _id: 0,
          studentId: { $toString: "$user._id" },
          name: "$studentDoc.name",
          rollNo: "$studentDoc.rollNo",
          branch: "$studentDoc.branch",
          year: "$user.year",
          section: "$studentDoc.section",
          present: 1,
          total: 1,
          pct: { $round: ["$pct", 1] },
        },
      },
      { $sort: { pct: 1, name: 1 } },
    ]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("admin/at-risk/attendance GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
