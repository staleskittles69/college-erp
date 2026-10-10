import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import FeeDue from "@/models/FeeDue";
import Student from "@/models/Student";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { resyncFromBooking } from "@/lib/feeDues";
import { formatRupees } from "@/lib/hostelTransport";

export const dynamic = "force-dynamic";

// { status: "paid" } ticks a due as paid at the accounts office. { status: "pending" } undoes a mistaken tick;
// the student's dues are then recalculated from what they currently have booked.
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const { status } = await request.json();
    if (status !== "paid" && status !== "pending") return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    await connectDB();
    const due = await FeeDue.findById(id);
    if (!due) return NextResponse.json({ error: "Due not found" }, { status: 404 });
    if (due.status === status) return NextResponse.json({ error: `Already marked ${status}` }, { status: 400 });

    const userId = due.userId.toString();
    if (status === "paid") {
      due.status = "paid";
      due.paidAt = new Date();
      due.markedBy = new mongoose.Types.ObjectId(payload.userId);
      await due.save();
    } else {
      due.status = "pending";
      due.paidAt = undefined;
      due.markedBy = undefined;
      await due.save();
      await resyncFromBooking(userId, due.type);
    }

    const student = await Student.findOne({ userId }).select("name rollNo").lean<{ name?: string; rollNo?: string }>();
    await logAudit(
      payload,
      "update",
      "FeeDue",
      `${status === "paid" ? "Marked paid" : "Undid payment for"}: ${due.type} fee ${formatRupees(due.amount)} — ${student?.name ?? "Unknown"} (${student?.rollNo ?? "?"})`,
      id
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin fee PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
