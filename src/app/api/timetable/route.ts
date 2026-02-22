import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Timetable from "@/models/Timetable";
import { getAuth, requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const payload = getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");

    if (payload.role === "student" && payload.studentId) {
      const Student = (await import("@/models/Student")).default;
      const student = await Student.findById(payload.studentId).lean();
      if (student) {
        const filter = {
          branch: student.branch,
          semester: student.semester,
          section: student.section,
        };
        const rows = await Timetable.find(filter).sort({ dayOfWeek: 1 }).lean();
        return NextResponse.json(
          rows.map((r) => ({
            _id: r._id.toString(),
            branch: r.branch,
            semester: r.semester,
            section: r.section,
            dayOfWeek: r.dayOfWeek,
            slots: r.slots,
          }))
        );
      }
    }

    const filter: Record<string, unknown> = {};
    if (branch) filter.branch = branch;
    if (semester != null) filter.semester = parseInt(semester, 10);
    if (section) filter.section = section;

    const rows = await Timetable.find(filter).sort({ dayOfWeek: 1 }).lean();
    return NextResponse.json(
      rows.map((r) => ({
        _id: r._id.toString(),
        branch: r.branch,
        semester: r.semester,
        section: r.section,
        dayOfWeek: r.dayOfWeek,
        slots: r.slots,
      }))
    );
  } catch (err) {
    console.error("Timetable GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getAuth(request);
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

    const row = await Timetable.findOneAndUpdate(
      { branch, semester: Number(semester), section, dayOfWeek: Number(dayOfWeek) },
      { branch, semester: Number(semester), section, dayOfWeek: Number(dayOfWeek), slots },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      _id: row._id.toString(),
      branch: row.branch,
      semester: row.semester,
      section: row.section,
      dayOfWeek: row.dayOfWeek,
      slots: row.slots,
    });
  } catch (err) {
    console.error("Timetable POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
