import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import LeaveRequest, { ILeaveRequest } from "@/models/LeaveRequest";
import Substitution, { ISubstitution } from "@/models/Substitution";
import Teacher, { ITeacher } from "@/models/Teacher";
import User from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { notifyUsers } from "@/lib/notifications";
import { dateRange, periodKey, slotStatus } from "@/lib/leave";
import { getAffectedClasses, getAvailability, serializeLeave } from "@/lib/leaveSchedule";

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

// GET /api/admin/leave/[id] — one request, every class it affects, and (while pending) who could cover each
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const leave = await LeaveRequest.findById(id).lean<ILeaveRequest>();
    if (!leave) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    const teacher = await Teacher.findById(leave.teacherId).lean<ITeacher>();
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const fromISO = isoDay(leave.fromDate);
    const toISO = isoDay(leave.toDate);
    const affected = await getAffectedClasses(teacher, fromISO, toISO);
    const covers = await Substitution.find({ leaveRequestId: leave._id }).lean<ISubstitution[]>();

    const coverNames = new Map(
      (
        await Teacher.find({ _id: { $in: covers.map((cover) => cover.substituteTeacherId) } })
          .select("name")
          .lean<Array<{ _id: { toString: () => string }; name: string }>>()
      ).map((found) => [found._id.toString(), found.name])
    );
    const coverFor = new Map(covers.map((cover) => [periodKey(isoDay(cover.date), cover.period), cover]));

    // Only a pending request needs a list of possible substitutes.
    let availability: Array<{ teacher: { _id: string; name: string }; status: (date: string, period: number) => ReturnType<typeof slotStatus> }> = [];
    if (leave.status === "pending") {
      const colleagues = await Teacher.find({ department: teacher.department, _id: { $ne: teacher._id } })
        .sort({ name: 1 })
        .lean<ITeacher[]>();
      const dates = dateRange(fromISO, toISO);
      availability = await Promise.all(
        colleagues.map(async (colleague) => {
          const busy = await getAvailability(colleague, dates, id);
          return {
            teacher: { _id: colleague._id.toString(), name: colleague.name },
            status: (date: string, period: number) => slotStatus(busy, date, period),
          };
        })
      );
    }

    return NextResponse.json({
      ...serializeLeave(leave),
      department: leave.department,
      classes: affected.map((cls) => {
        const cover = coverFor.get(periodKey(cls.date, cls.period));
        return {
          ...cls,
          year: cls.semester,
          substituteName: cover ? coverNames.get(cover.substituteTeacherId.toString()) ?? "Unknown" : null,
          // Everyone who could take it, colleagues with no clash first.
          candidates: availability
            .map((entry) => ({ ...entry.teacher, status: entry.status(cls.date, cls.period) }))
            .filter((candidate) => candidate.status !== "unavailable")
            .map(({ status, ...candidate }) => ({ ...candidate, hasClass: status === "has_class" }))
            .sort((a, b) => Number(a.hasClass) - Number(b.hasClass) || a.name.localeCompare(b.name)),
        };
      }),
    });
  } catch (error) {
    console.error("admin/leave/[id] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface Assignment {
  date?: unknown;
  period?: unknown;
  substituteTeacherId?: unknown;
}

// PATCH /api/admin/leave/[id] — { action: "approve", assignments: [{ date, period, substituteTeacherId }], adminNote? }
//                            or { action: "reject", adminNote? } (also undoes an approval and drops its substitutes)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload || !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action;
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Action must be approve or reject." }, { status: 400 });
    }
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : "";

    await connectDB();

    const leave = await LeaveRequest.findById(id);
    if (!leave) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    const admin = await User.findById(payload.userId).select("name").lean<{ name?: string }>();
    const actorName = admin?.name ?? "Admin";
    const fromISO = isoDay(leave.fromDate);
    const toISO = isoDay(leave.toDate);
    const range = `${shortDate(fromISO)}${fromISO === toISO ? "" : ` – ${shortDate(toISO)}`}`;

    if (action === "reject") {
      if (leave.status === "rejected") {
        return NextResponse.json({ error: "This request is already rejected." }, { status: 409 });
      }

      const dropped = await Substitution.find({ leaveRequestId: leave._id }).lean<ISubstitution[]>();
      await Substitution.deleteMany({ leaveRequestId: leave._id });

      leave.status = "rejected";
      leave.decidedBy = new mongoose.Types.ObjectId(payload.userId);
      leave.decidedAt = new Date();
      leave.adminNote = adminNote || undefined;
      await leave.save();

      await notifyUsers({
        recipientUserIds: [leave.userId.toString()],
        type: "leave_decision",
        actorUserId: payload.userId,
        actorName,
        title: "Leave rejected",
        preview: `${range}${adminNote ? ` — ${adminNote}` : ""}`,
        link: "/teachers/leave",
      });

      if (dropped.length > 0) {
        const substitutes = await Teacher.find({ _id: { $in: dropped.map((cover) => cover.substituteTeacherId) } })
          .select("userId")
          .lean<Array<{ userId: { toString: () => string } }>>();
        await notifyUsers({
          recipientUserIds: substitutes.map((substitute) => substitute.userId.toString()),
          type: "substitute_assigned",
          actorUserId: payload.userId,
          actorName,
          title: "Cover cancelled",
          preview: `${leave.teacherName}'s leave (${range}) was cancelled, so you no longer need to cover.`,
          link: "/teachers/leave",
        });
      }

      await logAudit(payload, "update", "Leave", `Rejected leave for ${leave.teacherName} (${range})`, id);
      return NextResponse.json(serializeLeave(leave));
    }

    // ---- approve ----
    if (leave.status !== "pending") {
      return NextResponse.json({ error: "Only a pending request can be approved." }, { status: 409 });
    }

    const teacher = await Teacher.findById(leave.teacherId).lean<ITeacher>();
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const affected = await getAffectedClasses(teacher, fromISO, toISO);
    const affectedByKey = new Map(affected.map((cls) => [periodKey(cls.date, cls.period), cls]));

    const requested: Assignment[] = Array.isArray(body.assignments) ? body.assignments : [];
    const wanted = requested.filter((entry) => entry.substituteTeacherId);

    // Only classes this teacher really has can be covered — class details come from the
    // timetable, never from what the browser sent.
    const picks: Array<{ cls: (typeof affected)[number]; substituteTeacherId: string }> = [];
    const pickedKeys = new Set<string>();
    for (const entry of wanted) {
      const key = typeof entry.date === "string" && typeof entry.period === "number"
        ? periodKey(entry.date, entry.period)
        : undefined;
      const cls = key ? affectedByKey.get(key) : undefined;
      if (!key || !cls || typeof entry.substituteTeacherId !== "string" || !mongoose.Types.ObjectId.isValid(entry.substituteTeacherId)) {
        return NextResponse.json({ error: "One of the substitute choices doesn't match a class in this leave." }, { status: 400 });
      }
      if (pickedKeys.has(key)) {
        return NextResponse.json({ error: "A class can only have one substitute." }, { status: 400 });
      }
      pickedKeys.add(key);
      picks.push({ cls, substituteTeacherId: entry.substituteTeacherId });
    }

    const substituteIds = [...new Set(picks.map((pick) => pick.substituteTeacherId))];
    const substitutes = await Teacher.find({ _id: { $in: substituteIds } }).lean<ITeacher[]>();
    const substituteById = new Map(substitutes.map((substitute) => [substitute._id.toString(), substitute]));

    const dates = dateRange(fromISO, toISO);
    const availabilityById = new Map(
      await Promise.all(
        substitutes.map(async (substitute) => [substitute._id.toString(), await getAvailability(substitute, dates, id)] as const)
      )
    );

    for (const pick of picks) {
      const substitute = substituteById.get(pick.substituteTeacherId);
      if (!substitute || substitute.department !== teacher.department || substitute._id.equals(teacher._id)) {
        return NextResponse.json({ error: "A substitute must be another teacher in the same department." }, { status: 400 });
      }
      if (slotStatus(availabilityById.get(pick.substituteTeacherId)!, pick.cls.date, pick.cls.period) === "unavailable") {
        return NextResponse.json(
          { error: `${substitute.name} is on leave or already covering a class in period ${pick.cls.period} on ${shortDate(pick.cls.date)}.` },
          { status: 409 }
        );
      }
    }

    if (picks.length > 0) {
      await Substitution.insertMany(
        picks.map(({ cls, substituteTeacherId }) => ({
          leaveRequestId: leave._id,
          date: new Date(cls.date),
          period: cls.period,
          time: cls.time,
          room: cls.room,
          subject: cls.subject,
          branch: cls.branch,
          semester: cls.semester,
          section: cls.section,
          originalTeacherId: teacher._id,
          substituteTeacherId,
        }))
      );
    }

    leave.status = "approved";
    leave.decidedBy = new mongoose.Types.ObjectId(payload.userId);
    leave.decidedAt = new Date();
    leave.adminNote = adminNote || undefined;
    await leave.save();

    const uncovered = affected.length - picks.length;
    await notifyUsers({
      recipientUserIds: [leave.userId.toString()],
      type: "leave_decision",
      actorUserId: payload.userId,
      actorName,
      title: "Leave approved",
      preview: `${range}${adminNote ? ` — ${adminNote}` : ""}`,
      link: "/teachers/leave",
    });

    for (const substitute of substitutes) {
      const mine = picks.filter((pick) => pick.substituteTeacherId === substitute._id.toString());
      await notifyUsers({
        recipientUserIds: [substitute.userId.toString()],
        type: "substitute_assigned",
        actorUserId: payload.userId,
        actorName,
        title: `You're covering ${mine.length} ${mine.length === 1 ? "class" : "classes"}`,
        preview: `For ${teacher.name}: ${mine.map(({ cls }) => `${shortDate(cls.date)} P${cls.period}`).join(", ")}`,
        link: "/teachers/leave",
      });
    }

    await logAudit(
      payload,
      "update",
      "Leave",
      `Approved leave for ${leave.teacherName} (${range}); ${picks.length} cover${picks.length === 1 ? "" : "s"} assigned, ${uncovered} uncovered`,
      id
    );

    return NextResponse.json({ ...serializeLeave(leave), covered: picks.length, uncovered });
  } catch (error) {
    console.error("admin/leave/[id] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
