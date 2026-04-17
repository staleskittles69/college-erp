import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import { getAuth, requireAdmin } from "@/lib/api-auth";

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
    } else if (!studentId && payload.role === "admin") {
      return NextResponse.json(
        { error: "studentId required for admin" },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = { studentId };
    if (subject) filter.subject = subject;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
      if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .lean();

    const result = records.map((r) => ({
      _id: (r._id as { toString: () => string }).toString(),
      studentId: (r.studentId as { toString: () => string }).toString(),
      subject: r.subject,
      date: r.date,
      status: r.status,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Attendance GET error:", err);
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
    const { studentId, subject, date, status } = body;
    const bulk = body.bulk as Array<{ studentId: string; status: string }> | undefined;

    await connectDB();

    if (bulk && Array.isArray(bulk) && subject && date) {
      const dateObj = new Date(date);
      const ops = bulk.map((b) => ({
        updateOne: {
          filter: {
            studentId: b.studentId,
            subject,
            date: dateObj,
          },
          update: {
            $set: {
              studentId: b.studentId,
              subject,
              date: dateObj,
              status: b.status === "present" ? "present" : "absent",
              markedBy: payload.userId,
            },
          },
          upsert: true,
        },
      }));
      const AttendanceModel = (await import("@/models/Attendance")).default;
      await AttendanceModel.bulkWrite(ops);
      return NextResponse.json({ success: true, count: bulk.length });
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

    return NextResponse.json({
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subject: record.subject,
      date: record.date,
      status: record.status,
    });
  } catch (err) {
    console.error("Attendance POST error:", err);
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

    return NextResponse.json({
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subject: record.subject,
      date: record.date,
      status: record.status,
    });
  } catch (err) {
    console.error("Attendance PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
