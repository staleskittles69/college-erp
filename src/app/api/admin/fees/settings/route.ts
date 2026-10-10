import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FeeSettings, { IFeeSettings } from "@/models/FeeSettings";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { getFeeSettings } from "@/lib/feeDues";

export const dynamic = "force-dynamic";

const FEE_KEYS = ["twoAc", "twoNonAc", "threeAc", "threeNonAc"] as const;

function toDay(date: Date | null | undefined): string | null {
  return date ? new Date(date).toISOString().slice(0, 10) : null;
}

function serialize(settings: IFeeSettings) {
  return {
    hostelFees: {
      twoAc: settings.hostelFees?.twoAc ?? 0,
      twoNonAc: settings.hostelFees?.twoNonAc ?? 0,
      threeAc: settings.hostelFees?.threeAc ?? 0,
      threeNonAc: settings.hostelFees?.threeNonAc ?? 0,
    },
    hostelDueDate: toDay(settings.hostelDueDate),
    transportDueDate: toDay(settings.transportDueDate),
  };
}

// "YYYY-MM-DD" -> UTC midnight; "" or null clears it; anything else is invalid (undefined).
function parseDay(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    return NextResponse.json(serialize(await getFeeSettings()));
  } catch (error) {
    console.error("Fee settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update hostel prices and/or due dates. Send only the fields being changed.
// New prices apply to new bookings; students already booked keep the price they booked at.
export async function PUT(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const update: Record<string, number | Date | null> = {};

    if (body.hostelFees !== undefined) {
      for (const key of FEE_KEYS) {
        const value = body.hostelFees?.[key];
        if (!Number.isFinite(value) || value < 0) return NextResponse.json({ error: "Enter a valid fee for every room type" }, { status: 400 });
        update[`hostelFees.${key}`] = value;
      }
    }
    for (const key of ["hostelDueDate", "transportDueDate"] as const) {
      if (body[key] === undefined) continue;
      const date = parseDay(body[key]);
      if (date === undefined) return NextResponse.json({ error: "Enter a valid due date" }, { status: 400 });
      update[key] = date;
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    await connectDB();
    const current = await getFeeSettings();
    const saved = await FeeSettings.findByIdAndUpdate(current._id, { $set: update }, { new: true }).lean<IFeeSettings>();

    const changed = Object.keys(update).some((key) => key.startsWith("hostelFees")) ? "hostel fees" : "due dates";
    await logAudit(payload, "update", "FeeSettings", `Updated ${changed}`);
    return NextResponse.json(serialize(saved ?? current));
  } catch (error) {
    console.error("Fee settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
