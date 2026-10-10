import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HostelRoom, { IHostelRoom } from "@/models/HostelRoom";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { hostelTypeLabel, roomRange } from "@/lib/hostelTransport";
import { serializeRoom } from "@/lib/hostelRooms";

export const dynamic = "force-dynamic";

// All rooms, optionally filtered by ?block= and ?gender=.
export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const filter: Record<string, string> = {};
    const block = searchParams.get("block");
    const gender = searchParams.get("gender");
    if (block) filter.block = block;
    if (gender === "boys" || gender === "girls") filter.gender = gender;

    await connectDB();
    const rooms = await HostelRoom.find(filter).sort({ block: 1, roomNumber: 1 }).lean<IHostelRoom[]>();
    return NextResponse.json(rooms.map(serializeRoom));
  } catch (error) {
    console.error("Hostel rooms GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Bulk-add rooms: { block, gender, from, to, sharing, ac } creates rooms from..to in that block.
// Room numbers that already exist in the block are skipped.
export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const block = typeof body.block === "string" ? body.block.trim().toUpperCase() : "";
    const sharing = Number(body.sharing);
    const { gender, ac } = body;
    if (!block) return NextResponse.json({ error: "Block is required" }, { status: 400 });
    if (gender !== "boys" && gender !== "girls") return NextResponse.json({ error: "Choose Boys or Girls" }, { status: 400 });
    if (sharing !== 2 && sharing !== 3) return NextResponse.json({ error: "Sharing must be 2 or 3" }, { status: 400 });
    if (typeof ac !== "boolean") return NextResponse.json({ error: "Choose AC or Non-AC" }, { status: 400 });
    const numbers = roomRange(String(body.from ?? "").trim(), String(body.to ?? body.from ?? "").trim());
    if (!numbers) return NextResponse.json({ error: "Enter a valid room number range (up to 200 rooms)" }, { status: 400 });

    await connectDB();

    // A block holds one gender only, so students are never mixed.
    const otherGender = await HostelRoom.exists({ block, gender: { $ne: gender } });
    if (otherGender) {
      return NextResponse.json({ error: `Block ${block} is already a ${gender === "boys" ? "girls'" : "boys'"} block` }, { status: 400 });
    }

    const existing = await HostelRoom.find({ block, roomNumber: { $in: numbers } }).select("roomNumber").lean<{ roomNumber: string }[]>();
    const taken = new Set(existing.map((room) => room.roomNumber));
    const toCreate = numbers.filter((number) => !taken.has(number));
    if (toCreate.length === 0) return NextResponse.json({ error: "All of those rooms already exist" }, { status: 400 });

    await HostelRoom.insertMany(toCreate.map((roomNumber) => ({ block, roomNumber, gender, sharing, ac })));

    await logAudit(
      payload,
      "create",
      "HostelRoom",
      `Added ${toCreate.length} ${hostelTypeLabel(sharing, ac)} room(s) to Block ${block} (${gender}): ${toCreate[0]}–${toCreate[toCreate.length - 1]}`
    );
    return NextResponse.json({ created: toCreate.length, skipped: taken.size });
  } catch (error) {
    console.error("Hostel rooms POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
