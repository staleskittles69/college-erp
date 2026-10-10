import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FeeDue, { IFeeDue } from "@/models/FeeDue";
import TransportBooking from "@/models/TransportBooking";
import HostelBooking from "@/models/HostelBooking";
import { getAuth } from "@/lib/api-auth";
import { getFeeSettings } from "@/lib/feeDues";
import { dueStatus } from "@/lib/hostelTransport";
import { toIdString } from "@/lib/utils";

export const dynamic = "force-dynamic";

// The student's hostel and transport dues. Read-only: payment happens at the accounts office.
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "student") return NextResponse.json({ error: "Forbidden — student only" }, { status: 403 });
    await connectDB();

    const [dues, settings, transport, hostel] = await Promise.all([
      FeeDue.find({ userId: payload.userId }).sort({ status: 1, createdAt: -1 }).lean<IFeeDue[]>(),
      getFeeSettings(),
      TransportBooking.findOne({ userId: payload.userId }).select("fee").lean<{ fee: number }>(),
      HostelBooking.findOne({ userId: payload.userId }).select("fee").lean<{ fee: number }>(),
    ]);

    const today = new Date();
    const dueDates = { hostel: settings.hostelDueDate ?? null, transport: settings.transportDueDate ?? null };

    // Paid more than the current booking costs (moved to something cheaper, or cancelled, after paying)?
    // Then the student is owed money back, which the accounts office handles.
    const paidByType = { hostel: 0, transport: 0 };
    for (const due of dues) if (due.status === "paid") paidByType[due.type] += due.amount;
    const refundDue = paidByType.hostel > (hostel?.fee ?? 0) || paidByType.transport > (transport?.fee ?? 0);

    return NextResponse.json({
      dues: dues.map((due) => ({
        id: toIdString(due._id),
        type: due.type,
        description: due.description,
        amount: due.amount,
        dueDate: dueDates[due.type],
        status: due.status === "paid" ? "paid" : dueStatus(due.amount, dueDates[due.type], today),
        paidAt: due.paidAt ?? null,
      })),
      totalPending: dues.filter((due) => due.status === "pending").reduce((sum, due) => sum + due.amount, 0),
      refundDue,
    });
  } catch (error) {
    console.error("student/fees GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
