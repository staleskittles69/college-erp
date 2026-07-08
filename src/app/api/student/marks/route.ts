import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Marks from "@/models/Marks";
import { getAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (payload.role !== "student") {
      return NextResponse.json({ error: "Forbidden — student only" }, { status: 403 });
    }

    await connectDB();

    const records = await Marks.find({ studentId: payload.userId })
      .sort({ subject: 1 })
      .lean();

    return NextResponse.json(
      records.map((record) => ({
        id: (record._id as { toString: () => string }).toString(),
        subject: record.subject,
        examType: record.examType,
        obtained: record.obtained,
        max: record.max,
      }))
    );
  } catch (error) {
    console.error("student/marks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
