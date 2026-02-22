import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Test from "@/models/Test";
import Student from "@/models/Student";
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
    const upcoming = searchParams.get("upcoming");

    let filter: Record<string, unknown> = {};
    if (payload.role === "student" && payload.studentId) {
      const student = await Student.findById(payload.studentId).lean();
      if (student) {
        filter.branch = student.branch;
        filter.semester = student.semester;
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
      tests.map((t) => ({
        _id: t._id.toString(),
        subject: t.subject,
        title: t.title,
        date: t.date,
        branch: t.branch,
        semester: t.semester,
        maxMarks: t.maxMarks,
      }))
    );
  } catch (err) {
    console.error("Tests GET error:", err);
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
    const { subject, title, date, branch, semester, maxMarks } = body;

    if (!subject || !title || !date) {
      return NextResponse.json(
        { error: "Missing required fields: subject, title, date" },
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
      maxMarks: maxMarks != null ? Number(maxMarks) : null,
    });

    return NextResponse.json({
      _id: test._id.toString(),
      subject: test.subject,
      title: test.title,
      date: test.date,
      branch: test.branch,
      semester: test.semester,
      maxMarks: test.maxMarks,
    });
  } catch (err) {
    console.error("Tests POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
