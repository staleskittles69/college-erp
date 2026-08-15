import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import Subject from "@/models/Subject";
import Timetable, { ITimetable } from "@/models/Timetable";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { getTeacherClasses } from "@/lib/teacherSchedule";

export async function GET(request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { teacherId } = await params;
    await connectDB();

    const teacher = await Teacher.findById(teacherId).lean() as ITeacher | null;
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const [classes, subjects] = await Promise.all([
      getTeacherClasses(teacher),
      Subject.find({ department: teacher.department, teacherIds: teacher._id }).select("name").sort({ name: 1 }).lean(),
    ]);

    return NextResponse.json({
      teaching: teacher.teaching,
      subjects: subjects.map((subject) => subject.name),
      classes,
    });
  } catch (error) {
    console.error("Admin teacher timetable GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { teacherId } = await params;
    const body = await request.json();
    const { branch, semester, section, dayOfWeek, period, subject, time, room } = body;

    if (branch == null || semester == null || section == null || dayOfWeek == null || period == null) {
      return NextResponse.json(
        { error: "Missing required fields: branch, semester, section, dayOfWeek, period" },
        { status: 400 }
      );
    }

    await connectDB();

    const teacher = await Teacher.findById(teacherId).lean() as ITeacher | null;
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const filter = {
      branch,
      semester: Number(semester),
      section,
      dayOfWeek: Number(dayOfWeek),
    };

    const existing = await Timetable.findOne(filter).lean() as ITimetable | null;
    const remainingSlots = (existing?.slots ?? []).filter((slot) => slot.period !== Number(period));

    const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
    const slots = trimmedSubject
      ? [...remainingSlots, { subject: trimmedSubject, period: Number(period), time: time ?? "", room: room ?? "" }]
      : remainingSlots;

    const timetableRow = await Timetable.findOneAndUpdate(
      filter,
      { ...filter, slots },
      { upsert: true, new: true }
    );

    await logAudit(
      payload,
      trimmedSubject ? (existing ? "update" : "create") : "update",
      "Timetable",
      `${trimmedSubject ? "Set" : "Cleared"} ${branch} sem ${semester} ${section} period ${period} (${teacher.name})`,
      timetableRow._id.toString()
    );

    return NextResponse.json({
      _id: timetableRow._id.toString(),
      branch: timetableRow.branch,
      semester: timetableRow.semester,
      section: timetableRow.section,
      dayOfWeek: timetableRow.dayOfWeek,
      slots: timetableRow.slots,
    });
  } catch (error) {
    console.error("Admin teacher timetable POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
