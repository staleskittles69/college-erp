import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Teacher, { ITeacher } from "@/models/Teacher";
import LeaveRequest, { ILeaveRequest } from "@/models/LeaveRequest";
import Substitution, { ISubstitution } from "@/models/Substitution";
import { getAuth } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { validateLeaveInput } from "@/lib/leave";
import { serializeLeave } from "@/lib/leaveSchedule";
import { collegeDateISO } from "@/lib/utils";

function todayISO() {
  return collegeDateISO();
}

// GET /api/teachers/leave — my leave requests (with who is covering each class) and the classes I'm covering
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const teacher = await Teacher.findOne({ userId: payload.userId }).select("_id").lean<Pick<ITeacher, "_id">>();
    if (!teacher) return NextResponse.json({ requests: [], covering: [] });

    const [requests, covers] = await Promise.all([
      LeaveRequest.find({ teacherId: teacher._id }).sort({ fromDate: -1 }).lean<ILeaveRequest[]>(),
      // Today's and upcoming covers I've been asked to take.
      Substitution.find({ substituteTeacherId: teacher._id, date: { $gte: new Date(todayISO()) } })
        .sort({ date: 1, period: 1 })
        .lean<ISubstitution[]>(),
    ]);

    const mine = await Substitution.find({ leaveRequestId: { $in: requests.map((leave) => leave._id) } })
      .sort({ date: 1, period: 1 })
      .lean<ISubstitution[]>();

    const teacherIds = new Set<string>();
    for (const cover of covers) teacherIds.add(cover.originalTeacherId.toString());
    for (const cover of mine) teacherIds.add(cover.substituteTeacherId.toString());
    const names = new Map(
      (await Teacher.find({ _id: { $in: [...teacherIds] } }).select("name").lean<Array<{ _id: { toString: () => string }; name: string }>>()).map(
        (found) => [found._id.toString(), found.name]
      )
    );

    return NextResponse.json({
      requests: requests.map((leave) => ({
        ...serializeLeave(leave),
        substitutions: mine
          .filter((cover) => cover.leaveRequestId.toString() === leave._id.toString())
          .map((cover) => ({
            date: cover.date.toISOString().slice(0, 10),
            period: cover.period,
            subject: cover.subject,
            branch: cover.branch,
            section: cover.section,
            substituteName: names.get(cover.substituteTeacherId.toString()) ?? "Unknown",
          })),
      })),
      covering: covers.map((cover) => ({
        _id: cover._id.toString(),
        date: cover.date.toISOString().slice(0, 10),
        period: cover.period,
        time: cover.time,
        room: cover.room,
        subject: cover.subject,
        branch: cover.branch,
        year: cover.semester,
        section: cover.section,
        coveringFor: names.get(cover.originalTeacherId.toString()) ?? "Unknown",
      })),
    });
  } catch (error) {
    console.error("teachers/leave GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/teachers/leave — ask for leave
export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const validationError = validateLeaveInput(body, todayISO());
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    await connectDB();

    const teacher = await Teacher.findOne({ userId: payload.userId }).lean<ITeacher>();
    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const overlapping = await LeaveRequest.exists({
      teacherId: teacher._id,
      status: { $in: ["pending", "approved"] },
      fromDate: { $lte: new Date(body.toDate) },
      toDate: { $gte: new Date(body.fromDate) },
    });
    if (overlapping) {
      return NextResponse.json(
        { error: "You already have a pending or approved leave request on some of these dates." },
        { status: 409 }
      );
    }

    const leave = await LeaveRequest.create({
      teacherId: teacher._id,
      userId: payload.userId,
      teacherName: teacher.name,
      department: teacher.department,
      fromDate: new Date(body.fromDate),
      toDate: new Date(body.toDate),
      reason: body.reason.trim(),
    });

    await logAudit(
      payload,
      "create",
      "Leave",
      `Requested leave ${body.fromDate} to ${body.toDate}`,
      leave._id.toString()
    );

    return NextResponse.json(serializeLeave(leave));
  } catch (error) {
    console.error("teachers/leave POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
