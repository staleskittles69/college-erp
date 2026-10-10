import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import HostelRoom, { IHostelRoom } from "@/models/HostelRoom";
import HostelBooking from "@/models/HostelBooking";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { hostelTypeLabel } from "@/lib/hostelTransport";
import { serializeRoom } from "@/lib/hostelRooms";
import { toIdString } from "@/lib/utils";
import { rollNumbersFor } from "@/lib/studentRollNumbers";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type OccupantUser = { _id: mongoose.Types.ObjectId; name?: string; branch?: string; year?: number; section?: string };

// The room plus the students living in it.
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await connectDB();
    const room = await HostelRoom.findById(id).lean<IHostelRoom>();
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const bookings = await HostelBooking.find({ roomId: id }).populate("userId", "name branch year section").lean();
    const rolls = await rollNumbersFor(bookings.map((booking) => (booking.userId as unknown as OccupantUser | null)?._id ?? booking.userId));

    return NextResponse.json({
      ...serializeRoom(room),
      occupants: bookings.map((booking) => {
        const user = booking.userId as unknown as OccupantUser | null;
        return {
          id: toIdString(booking._id),
          name: user?.name ?? "Unknown",
          rollNumber: user ? rolls.get(user._id.toString()) ?? "" : "",
          className: user ? `${user.branch ?? ""} Y${user.year ?? ""} ${user.section ?? ""}`.trim() : "",
        };
      }),
    });
  } catch (error) {
    console.error("Hostel room GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// An empty room can be changed freely. Once students live in it, only switching it on/off is allowed,
// so a booking never ends up pointing at a room of a different type or gender.
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    await connectDB();

    const room = await HostelRoom.findById(id);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const changesType = ["sharing", "ac", "gender"].some((key) => body[key] !== undefined && body[key] !== room.get(key));
    if (changesType && room.occupiedBeds > 0) {
      return NextResponse.json({ error: "Students live in this room, so only its on/off status can change" }, { status: 400 });
    }

    if (body.sharing !== undefined) {
      const sharing = Number(body.sharing);
      if (sharing !== 2 && sharing !== 3) return NextResponse.json({ error: "Sharing must be 2 or 3" }, { status: 400 });
      room.sharing = sharing;
    }
    if (body.ac !== undefined) {
      if (typeof body.ac !== "boolean") return NextResponse.json({ error: "Choose AC or Non-AC" }, { status: 400 });
      room.ac = body.ac;
    }
    if (body.gender !== undefined) {
      if (body.gender !== "boys" && body.gender !== "girls") return NextResponse.json({ error: "Choose Boys or Girls" }, { status: 400 });
      room.gender = body.gender;
    }
    if (body.active !== undefined) room.active = Boolean(body.active);

    await room.save();
    await logAudit(
      payload,
      "update",
      "HostelRoom",
      `Updated Block ${room.block} Room ${room.roomNumber} (${hostelTypeLabel(room.sharing, room.ac)}, ${room.gender}, ${room.active ? "on" : "off"})`,
      id
    );
    return NextResponse.json(serializeRoom(room.toObject() as IHostelRoom));
  } catch (error) {
    console.error("Hostel room PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await connectDB();
    if (await HostelBooking.exists({ roomId: id })) {
      return NextResponse.json({ error: "Students live in this room. Switch it off instead." }, { status: 400 });
    }

    const deleted = await HostelRoom.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    await logAudit(payload, "delete", "HostelRoom", `Deleted Block ${deleted.block} Room ${deleted.roomNumber}`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hostel room DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
