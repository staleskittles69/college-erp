import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Marks from "@/models/Marks";
import { getAuth, requireAdmin } from "@/lib/api-auth";

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

    const records = await Marks.find({ studentId }).sort({ subject: 1 }).lean();

    return NextResponse.json(
      records.map((r) => ({
        id: (r._id as { toString: () => string }).toString(),
        studentId: (r.studentId as { toString: () => string }).toString(),
        subject: r.subject,
        examType: r.examType,
        obtained: r.obtained,
        max: r.max,
      }))
    );
  } catch (err) {
    console.error("admin/marks GET error:", err);
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
  } catch (err) {
    console.error("admin/marks POST error:", err);
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

    await Marks.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin/marks DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
