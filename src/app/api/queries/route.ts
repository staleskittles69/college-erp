import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Query from "@/models/Query";
import User from "@/models/User";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import { getAuth, requireAdmin } from "@/lib/api-auth";

function serializeQuery(query: {
  _id: { toString: () => string };
  fromName: string;
  fromRole: "student" | "teacher";
  toRole: "admin" | "teacher";
  toName: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  createdAt: Date;
}) {
  return {
    _id: query._id.toString(),
    fromName: query.fromName,
    fromRole: query.fromRole,
    toRole: query.toRole,
    toName: query.toName,
    subject: query.subject,
    message: query.message,
    status: query.status,
    createdAt: query.createdAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const box = searchParams.get("box");

    const filter: Record<string, unknown> = {};

    if (requireAdmin(payload)) {
      if (status === "open" || status === "resolved") filter.status = status;
      if (role === "student" || role === "teacher") filter.fromRole = role;
    } else if (payload.role === "teacher" && box === "received") {
      filter.toRole = "teacher";
      filter.toUserId = payload.userId;
      if (status === "open" || status === "resolved") filter.status = status;
    } else {
      filter.fromUserId = payload.userId;
    }

    const queries = await Query.find(filter)
      .sort({ createdAt: -1 })
      .lean<Array<Parameters<typeof serializeQuery>[0]>>();

    return NextResponse.json(queries.map(serializeQuery));
  } catch (error) {
    console.error("Queries GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "student" && payload.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { subject, message, toTeacherUserId } = body;
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(payload.userId).select("name").lean<{ name?: string }>();

    let toRole: "admin" | "teacher" = "admin";
    let toUserId: string | undefined;
    let toName = "Admin";

    // Only students can direct a query to a specific teacher, and only to one
    // of their own assigned teachers (re-verified server-side, not trusted from the client).
    if (payload.role === "student" && toTeacherUserId) {
      const student = await Student.findOne({ userId: payload.userId })
        .select("branch semester section")
        .lean<{ branch: string; semester: number; section: string }>();

      if (student) {
        const year = Math.ceil(student.semester / 2);
        const teacher = await Teacher.findOne({
          userId: toTeacherUserId,
          teaching: { $elemMatch: { branch: student.branch, year, sections: student.section } },
        })
          .select("name userId")
          .lean<{ name: string; userId: { toString: () => string } }>();

        if (teacher) {
          toRole = "teacher";
          toUserId = teacher.userId.toString();
          toName = teacher.name;
        }
      }
    }

    const query = await Query.create({
      fromUserId: payload.userId,
      fromName: user?.name ?? "Unknown",
      fromRole: payload.role,
      toRole,
      toUserId,
      toName,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
    });

    return NextResponse.json(serializeQuery(query));
  } catch (error) {
    console.error("Queries POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
