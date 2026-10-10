import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import FeeDue, { IFeeDue } from "@/models/FeeDue";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { toIdString } from "@/lib/utils";
import { rollNumbersFor, studentUserIdsMatching } from "@/lib/studentRollNumbers";

export const dynamic = "force-dynamic";

const LIMIT = 200;

type DueUser = { _id: mongoose.Types.ObjectId; name?: string; branch?: string; year?: number; section?: string };

// Dues across all students. ?status=pending|paid, ?type=hostel|transport, ?search=<roll number or name>.
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim();

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (status === "pending" || status === "paid") filter.status = status;
    if (type === "hostel" || type === "transport") filter.type = type;
    if (search) {
      filter.userId = { $in: await studentUserIdsMatching(search) };
    }

    const [dues, totalPending] = await Promise.all([
      FeeDue.find(filter)
        .sort(status === "paid" ? { paidAt: -1 } : { createdAt: -1 })
        .limit(LIMIT)
        .populate("userId", "name branch year section")
        .lean<(Omit<IFeeDue, "userId"> & { userId: DueUser | null })[]>(),
      FeeDue.aggregate<{ total: number; count: number }>([
        { $match: { status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const rolls = await rollNumbersFor(dues.flatMap((due) => (due.userId ? [due.userId._id] : [])));

    return NextResponse.json({
      dues: dues.map((due) => ({
        id: toIdString(due._id),
        type: due.type,
        description: due.description,
        amount: due.amount,
        status: due.status,
        createdAt: due.createdAt,
        paidAt: due.paidAt ?? null,
        studentName: due.userId?.name ?? "Unknown",
        rollNumber: due.userId ? rolls.get(due.userId._id.toString()) ?? "" : "",
        className: due.userId ? `${due.userId.branch ?? ""} Y${due.userId.year ?? ""} ${due.userId.section ?? ""}`.trim() : "",
      })),
      limited: dues.length === LIMIT,
      pendingTotal: totalPending[0]?.total ?? 0,
      pendingCount: totalPending[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Admin fees GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
