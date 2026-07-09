import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Test from "@/models/Test";
import Notice from "@/models/Notice";
import { getAuth, requireAdmin } from "@/lib/api-auth";

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
        _id: (test._id as { toString: () => string }).toString(),
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
    const { subject, title, date, branch, semester, section, testType, maxMarks, dueTime, notes, attachmentUrl } = body;

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
      section: section ?? null,
      testType: testType ?? null,
      maxMarks: maxMarks != null ? Number(maxMarks) : null,
      dueTime: dueTime ?? null,
      notes: notes ?? null,
      attachmentUrl: attachmentUrl ?? null,
    });

    if (branch) {
      await Notice.create({
        title: `${testType ?? "Test"} Scheduled: ${title}`,
        body: `A ${(testType ?? "test").toLowerCase()} for ${subject} has been scheduled on ${new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${dueTime ? ` at ${dueTime}` : ""}.${maxMarks ? ` Max marks: ${maxMarks}.` : ""}`,
        createdBy: payload.userId,
        pinned: false,
        targetBranch: branch,
        targetYear: semester != null ? Number(semester) : null,
      });
    }

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
    });
  } catch (error) {
    console.error("Tests POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
