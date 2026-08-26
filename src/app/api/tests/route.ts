import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Test, { ITest } from "@/models/Test";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { JwtPayload } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isValidTestTime, toIdString } from "@/lib/utils";

interface BulkTestRow {
  subject?: string;
  title?: string;
  date?: string;
  dueTime?: string | null;
  maxMarks?: number | string | null;
  notes?: string | null;
}

// Schedules several tests at once (e.g. 4 consecutive mid-exams) as one linked series.
// Mirrors the bulk pattern already used for attendance: one endpoint, an array in the
// body, a single audit log entry for the whole batch instead of one per record.
async function handleBulkCreate(body: Record<string, unknown>, payload: JwtPayload) {
  const rows = body.bulk as BulkTestRow[];
  const branch = typeof body.branch === "string" ? body.branch : "";
  const semester = body.semester;
  const testType = typeof body.testType === "string" ? body.testType : "";
  const seriesLabel = typeof body.seriesLabel === "string" && body.seriesLabel.trim() ? body.seriesLabel.trim() : "Test Series";

  if (!branch || semester == null || !testType) {
    return NextResponse.json({ error: "Branch, year and test type are required for bulk scheduling" }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "At least one test is required" }, { status: 400 });
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.subject || !row.date) {
      return NextResponse.json({ error: `Row ${i + 1}: subject and date are required` }, { status: 400 });
    }
    if (row.dueTime && !isValidTestTime(row.dueTime)) {
      return NextResponse.json(
        { error: `Row ${i + 1}: Time / Period must look like '10:00 AM' or 'Period 3'.` },
        { status: 400 }
      );
    }
  }

  await connectDB();

  const seriesId = new mongoose.Types.ObjectId();
  const docs = rows.map((row) => ({
    subject: row.subject,
    title: row.title?.trim() || `${testType} - ${row.subject}`,
    date: new Date(row.date!),
    branch,
    semester: Number(semester),
    section: null,
    testType,
    maxMarks: row.maxMarks != null && row.maxMarks !== "" ? Number(row.maxMarks) : null,
    dueTime: row.dueTime || null,
    notes: row.notes || null,
    seriesId,
    seriesLabel,
  }));

  const created = await Test.insertMany(docs);

  await logAudit(
    payload,
    "create",
    "Test",
    `Scheduled series "${seriesLabel}" with ${created.length} tests (${branch}, ${testType})`,
    seriesId.toString()
  );

  return NextResponse.json({
    success: true,
    count: created.length,
    seriesId: seriesId.toString(),
    tests: created.map((test: ITest) => ({
      _id: test._id.toString(),
      subject: test.subject,
      title: test.title,
      date: test.date,
      branch: test.branch,
      semester: test.semester,
      section: test.section,
      testType: test.testType,
      maxMarks: test.maxMarks,
      dueTime: test.dueTime,
      notes: test.notes,
      seriesId: test.seriesId?.toString() ?? null,
      seriesLabel: test.seriesLabel,
    })),
  });
}

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
    const upcoming = searchParams.get("upcoming");

    let filter: Record<string, unknown> = {};
    if (payload.role === "student") {
      const User = (await import("@/models/User")).default;
      const user = await User.findById(payload.userId).lean() as { branch?: string; year?: number; } | null;
      if (user?.branch && user?.year) {
        filter.branch = user.branch;
        filter.semester = user.year;
      }
    } else {
      if (branch) filter.branch = branch;
      if (semester != null) filter.semester = parseInt(semester, 10);
    }

    if (upcoming === "true") {
      filter.date = { $gte: new Date() };
    }

    const tests = await Test.find(filter).sort({ date: 1 }).lean();
    return NextResponse.json(
      tests.map((test) => ({
        _id: toIdString(test._id),
        subject: test.subject,
        title: test.title,
        date: test.date,
        branch: test.branch,
        semester: test.semester,
        section: test.section,
        testType: test.testType,
        maxMarks: test.maxMarks,
        dueTime: test.dueTime,
        notes: test.notes,
        attachmentUrl: test.attachmentUrl,
        attachmentName: test.attachmentName,
        seriesId: test.seriesId ? toIdString(test.seriesId) : null,
        seriesLabel: test.seriesLabel,
      }))
    );
  } catch (error) {
    console.error("Tests GET error:", error);
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

    if (Array.isArray(body.bulk)) {
      return handleBulkCreate(body, payload);
    }

    const { subject, title, date, branch, semester, section, testType, maxMarks, dueTime, notes, attachmentUrl, attachmentName } = body;

    if (!subject || !title || !date) {
      return NextResponse.json(
        { error: "Missing required fields: subject, title, date" },
        { status: 400 }
      );
    }
    if (dueTime && !isValidTestTime(dueTime)) {
      return NextResponse.json(
        { error: "Time / Period must look like '10:00 AM' or 'Period 3'." },
        { status: 400 }
      );
    }

    await connectDB();

    const test = await Test.create({
      subject,
      title,
      date: new Date(date),
      branch: branch ?? null,
      semester: semester != null ? Number(semester) : null,
      section: section ?? null,
      testType: testType ?? null,
      maxMarks: maxMarks != null ? Number(maxMarks) : null,
      dueTime: dueTime ?? null,
      notes: notes ?? null,
      attachmentUrl: attachmentUrl ?? null,
      attachmentName: attachmentName ?? null,
    });

    await logAudit(
      payload,
      "create",
      "Test",
      `Created test "${test.title}" (${test.subject})`,
      test._id.toString()
    );

    return NextResponse.json({
      _id: test._id.toString(),
      subject: test.subject,
      title: test.title,
      date: test.date,
      branch: test.branch,
      semester: test.semester,
      section: test.section,
      testType: test.testType,
      maxMarks: test.maxMarks,
      dueTime: test.dueTime,
      notes: test.notes,
      attachmentUrl: test.attachmentUrl,
      attachmentName: test.attachmentName,
    });
  } catch (error) {
    console.error("Tests POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
