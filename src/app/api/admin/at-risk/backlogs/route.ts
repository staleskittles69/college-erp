import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Marks from "@/models/Marks";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { BACKLOG_FAIL_THRESHOLD_PCT } from "@/lib/academics";

interface BacklogRow {
  studentId: string;
  name: string;
  rollNo: string;
  branch: string;
  year: number;
  section: string;
  backlogCount: number;
  backlogSubjects: { subject: string; pct: number }[];
}

// GET /api/admin/at-risk/backlogs — students ranked by number of failed subjects, descending
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const rows = await Marks.aggregate<BacklogRow>([
      {
        $group: {
          _id: { studentId: "$studentId", subject: "$subject" },
          totalObtained: { $sum: "$obtained" },
          totalMax: { $sum: "$max" },
        },
      },
      {
        $project: {
          studentId: "$_id.studentId",
          subject: "$_id.subject",
          pct: { $multiply: [{ $divide: ["$totalObtained", "$totalMax"] }, 100] },
        },
      },
      {
        $addFields: {
          isBacklog: { $lt: ["$pct", BACKLOG_FAIL_THRESHOLD_PCT] },
        },
      },
      {
        $group: {
          _id: "$studentId",
          backlogCount: { $sum: { $cond: ["$isBacklog", 1, 0] } },
          backlogSubjects: {
            $push: {
              $cond: ["$isBacklog", { subject: "$subject", pct: { $round: ["$pct", 1] } }, "$$REMOVE"],
            },
          },
        },
      },
      { $match: { backlogCount: { $gt: 0 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.role": "student" } },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "userId",
          as: "studentDoc",
        },
      },
      { $unwind: { path: "$studentDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          studentId: { $toString: "$_id" },
          name: "$user.name",
          rollNo: { $ifNull: ["$studentDoc.rollNo", ""] },
          branch: "$user.branch",
          year: "$user.year",
          section: "$user.section",
          backlogCount: 1,
          backlogSubjects: 1,
        },
      },
      { $sort: { backlogCount: -1, name: 1 } },
    ]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("admin/at-risk/backlogs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
