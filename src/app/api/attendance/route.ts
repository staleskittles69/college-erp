import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { toIdString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    let studentId = searchParams.get("studentId");
    const subject = searchParams.get("subject");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (payload.role === "student") {
      studentId = payload.userId;
    }

    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const year = searchParams.get("year");
    const section = searchParams.get("section");

    // Staff must narrow the request (a student, a class, or a date range) — an unfiltered
    // call would return every attendance record in the college.
    if (!studentId && !branch && !semester && !year && !section && !from && !to) {
      return NextResponse.json({ error: "Pick a student, class, or date range." }, { status: 400 });
    }

    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;
    if (subject) filter.subject = subject;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
      if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
    }

    // branch/year/section are not stored on Attendance — resolve via the student User records
    // (Attendance.studentId is the student's User id).
    if ((branch || semester || year || section) && !filter.studentId) {
      const userFilter: Record<string, unknown> = { role: "student" };
      if (branch) userFilter.branch = branch;
      if (year) userFilter.year = Number(year);
      else if (semester) userFilter.year = Math.ceil(Number(semester) / 2);
      if (section) userFilter.section = section;
      const matchingStudents = await User.find(userFilter).select("_id").lean();
      filter.studentId = {
        $in: matchingStudents.map((student) => toIdString(student._id)),
      };
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .lean();

    const result = records.map((record) => ({
      _id: toIdString(record._id),
      studentId: (record.studentId as { toString: () => string }).toString(),
      subject: record.subject,
      date: record.date,
      status: record.status,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Attendance GET error:", error);
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
    if (payload.role !== "teacher" && !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, subject, date, status } = body;
    const bulkEntries = body.bulk as Array<{ studentId: string; status: string }> | undefined;

    await connectDB();

    if (Array.isArray(bulkEntries)) {
      if (!subject || !date || bulkEntries.some((entry) => typeof entry?.studentId !== "string")) {
        return NextResponse.json(
          { error: "Bulk attendance needs a subject, a date and a studentId for each entry" },
          { status: 400 }
        );
      }
      const dateObj = new Date(date);
      const bulkOps = bulkEntries.map((entry) => ({
        updateOne: {
          filter: {
            studentId: entry.studentId,
            subject,
            date: dateObj,
          },
          update: {
            $set: {
              studentId: entry.studentId,
              subject,
              date: dateObj,
              status: entry.status === "present" ? "present" : "absent",
              markedBy: payload.userId,
            },
          },
          upsert: true,
        },
      }));
      const AttendanceModel = (await import("@/models/Attendance")).default;
      await AttendanceModel.bulkWrite(bulkOps);

      await logAudit(
        payload,
        "update",
        "Attendance",
        `Marked attendance for ${bulkEntries.length} student(s) in ${subject} on ${dateObj.toDateString()}`
      );

      return NextResponse.json({ success: true, count: bulkEntries.length });
    }

    if (!studentId || !subject || !date || !status) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, subject, date, status" },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    const record = await Attendance.findOneAndUpdate(
      { studentId, subject, date: dateObj },
      {
        studentId,
        subject,
        date: dateObj,
        status: status === "present" ? "present" : "absent",
        markedBy: payload.userId,
      },
      { upsert: true, new: true }
    );

    await logAudit(
      payload,
      "update",
      "Attendance",
      `Marked ${record.status} for student ${record.studentId.toString()} in ${record.subject} on ${dateObj.toDateString()}`,
      record._id.toString()
    );

    return NextResponse.json({
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subject: record.subject,
      date: record.date,
      status: record.status,
    });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }

    await connectDB();

    const record = await Attendance.findByIdAndUpdate(
      id,
      { status: status === "present" ? "present" : "absent", markedBy: payload.userId },
      { new: true }
    );
    if (!record) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    await logAudit(
      payload,
      "update",
      "Attendance",
      `Corrected attendance to ${record.status} for student ${record.studentId.toString()} in ${record.subject} on ${new Date(record.date).toDateString()}`,
      record._id.toString()
    );

    return NextResponse.json({
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subject: record.subject,
      date: record.date,
      status: record.status,
    });
  } catch (error) {
    console.error("Attendance PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
