import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Marks from "@/models/Marks";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { toIdString } from "@/lib/utils";

// GET /api/admin/marks?studentId=xxx
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    await connectDB();

    const markRecords = await Marks.find({ studentId }).sort({ subject: 1 }).lean();

    return NextResponse.json(
      markRecords.map((record) => ({
        id: toIdString(record._id),
        studentId: (record.studentId as { toString: () => string }).toString(),
        subject: record.subject,
        examType: record.examType,
        obtained: record.obtained,
        max: record.max,
      }))
    );
  } catch (error) {
    console.error("admin/marks GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/marks
export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, subject, examType, obtained, max } = body;

    if (!studentId || !subject || !examType || obtained == null || !max) {
      return NextResponse.json(
        { error: "studentId, subject, examType, obtained, max are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const record = await Marks.create({
      studentId,
      subject,
      examType,
      obtained: Number(obtained),
      max: Number(max),
    });

    await logAudit(
      payload,
      "create",
      "Marks",
      `Added ${examType} marks for student ${studentId} in ${subject}: ${record.obtained}/${record.max}`,
      record._id.toString()
    );

    return NextResponse.json(
      {
        id: record._id.toString(),
        studentId: record.studentId.toString(),
        subject: record.subject,
        examType: record.examType,
        obtained: record.obtained,
        max: record.max,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("admin/marks POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/marks?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await connectDB();

    const deleted = await Marks.findByIdAndDelete(id);
    if (deleted) {
      await logAudit(
        payload,
        "delete",
        "Marks",
        `Deleted ${deleted.examType} marks for student ${deleted.studentId.toString()} in ${deleted.subject}`,
        deleted._id.toString()
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin/marks DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
