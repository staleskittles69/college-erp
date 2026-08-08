import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Timetable from "@/models/Timetable";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");

    if (payload.role === "student") {
      const User = (await import("@/models/User")).default;
      const user = await User.findById(payload.userId).lean() as { branch?: string; year?: number; section?: string; } | null;
      if (user?.branch && user?.year && user?.section) {
        const timetableRows = await Timetable.find({
          branch: user.branch,
          semester: user.year,
          section: user.section,
        }).sort({ dayOfWeek: 1 }).lean();
        return NextResponse.json(
          timetableRows.map((row) => ({
            _id: (row._id as { toString: () => string }).toString(),
            branch: row.branch,
            semester: row.semester,
            section: row.section,
            dayOfWeek: row.dayOfWeek,
            slots: row.slots,
          }))
        );
      }
    }

    const filter: Record<string, unknown> = {};
    if (branch) filter.branch = branch;
    if (semester != null) filter.semester = parseInt(semester, 10);
    if (section) filter.section = section;

    const timetableRows = await Timetable.find(filter).sort({ dayOfWeek: 1 }).lean();
    return NextResponse.json(
      timetableRows.map((row) => ({
        _id: (row._id as { toString: () => string }).toString(),
        branch: row.branch,
        semester: row.semester,
        section: row.section,
        dayOfWeek: row.dayOfWeek,
        slots: row.slots,
      }))
    );
  } catch (error) {
    console.error("Timetable GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { branch, semester, section, dayOfWeek, slots } = body;

    if (
      branch == null ||
      semester == null ||
      section == null ||
      dayOfWeek == null ||
      !Array.isArray(slots)
    ) {
      return NextResponse.json(
        { error: "Missing required fields: branch, semester, section, dayOfWeek, slots" },
        { status: 400 }
      );
    }

    await connectDB();

    const existed = await Timetable.exists({
      branch,
      semester: Number(semester),
      section,
      dayOfWeek: Number(dayOfWeek),
    });

    const timetableRow = await Timetable.findOneAndUpdate(
      { branch, semester: Number(semester), section, dayOfWeek: Number(dayOfWeek) },
      { branch, semester: Number(semester), section, dayOfWeek: Number(dayOfWeek), slots },
      { upsert: true, new: true }
    );

    await logAudit(
      payload,
      existed ? "update" : "create",
      "Timetable",
      `${existed ? "Updated" : "Created"} timetable for ${branch} sem ${semester} section ${section}, day ${dayOfWeek}`,
      timetableRow._id.toString()
    );

    return NextResponse.json({
      _id: timetableRow._id.toString(),
      branch: timetableRow.branch,
      semester: timetableRow.semester,
      section: timetableRow.section,
      dayOfWeek: timetableRow.dayOfWeek,
      slots: timetableRow.slots,
    });
  } catch (error) {
    console.error("Timetable POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
