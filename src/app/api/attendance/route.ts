import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { toIdString } from "@/lib/utils";
import { PERIODS } from "@/lib/academics";
import { canMarkAttendance, findTeacher } from "@/lib/teacherAccess";
import { isISODate } from "@/lib/leave";

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
    const period = searchParams.get("period");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (payload.role === "student") {
      studentId = payload.userId;
    }

    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const year = searchParams.get("year");
    const section = searchParams.get("section");

    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;
    if (subject) filter.subject = subject;
    if (period && PERIODS.includes(Number(period))) filter.period = Number(period);
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
      period: record.period ?? null,
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
    const isBulk = Array.isArray(body.bulk);
    // A single record is handled as a list of one, so both go through the same checks.
    const entries = (isBulk ? body.bulk : [{ studentId, status }]) as Array<{ studentId?: unknown; status?: unknown }>;
    const period = Number(body.period);

    if (
      typeof subject !== "string" ||
      !subject.trim() ||
      !isISODate(date) ||
      entries.length === 0 ||
      entries.some((entry) => typeof entry?.studentId !== "string" || !mongoose.Types.ObjectId.isValid(entry.studentId)) ||
      (!isBulk && !status)
    ) {
      return NextResponse.json(
        { error: "Attendance needs a subject, a date (YYYY-MM-DD) and a student for each entry" },
        { status: 400 }
      );
    }
    if (!PERIODS.includes(period)) {
      return NextResponse.json({ error: "Pick the period this class was in" }, { status: 400 });
    }

    await connectDB();

    const dateObj = new Date(date);
    const studentIds = [...new Set(entries.map((entry) => entry.studentId as string))];
    const students = await User.find({ _id: { $in: studentIds }, role: "student" })
      .select("branch year section")
      .lean<Array<{ branch?: string; year?: number; section?: string }>>();
    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: "Some of these students weren't found" }, { status: 400 });
    }

    // Teachers may only mark their own classes and subjects, or a class they cover at this period.
    if (payload.role === "teacher") {
      const teacher = await findTeacher(payload.userId);
      if (!teacher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const classes = new Map(
        students.map((student) => [`${student.branch}|${student.year}|${student.section}`, student])
      );
      for (const { branch, year, section } of classes.values()) {
        if (!branch || !year || !section || !(await canMarkAttendance(teacher, { branch, year, section }, subject, dateObj, period))) {
          return NextResponse.json(
            { error: "You can only take attendance for your own classes and subjects, or a class you're covering" },
            { status: 403 }
          );
        }
      }
    }

    if (isBulk) {
      const bulkOps = entries.map((entry) => ({
        updateOne: {
          filter: { studentId: entry.studentId, subject, date: dateObj, period },
          update: {
            $set: {
              studentId: entry.studentId,
              subject,
              date: dateObj,
              period,
              status: entry.status === "present" ? "present" : "absent",
              markedBy: payload.userId,
            },
          },
          upsert: true,
        },
      }));
      await Attendance.bulkWrite(bulkOps);

      await logAudit(
        payload,
        "update",
        "Attendance",
        `Marked attendance for ${entries.length} student(s) in ${subject}, period ${period} on ${dateObj.toDateString()}`
      );

      return NextResponse.json({ success: true, count: entries.length });
    }

    const record = await Attendance.findOneAndUpdate(
      { studentId, subject, date: dateObj, period },
      {
        studentId,
        subject,
        date: dateObj,
        period,
        status: status === "present" ? "present" : "absent",
        markedBy: payload.userId,
      },
      { upsert: true, new: true }
    );

    await logAudit(
      payload,
      "update",
      "Attendance",
      `Marked ${record.status} for student ${record.studentId.toString()} in ${record.subject}, period ${period} on ${dateObj.toDateString()}`,
      record._id.toString()
    );

    return NextResponse.json({
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subject: record.subject,
      date: record.date,
      period: record.period ?? null,
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
