import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HostelRoom, { IHostelRoom } from "@/models/HostelRoom";
import HostelBooking, { IHostelBooking } from "@/models/HostelBooking";
import Student from "@/models/Student";
import { getAuth } from "@/lib/api-auth";
import { getFeeSettings, hostelDueDescription, syncDue } from "@/lib/feeDues";
import { HOSTEL_TYPES, HostelGender, hostelFeeFor, hostelTypeLabel, normalizeGender } from "@/lib/hostelTransport";

export const dynamic = "force-dynamic";

async function studentOnly(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (payload.role !== "student") return { error: NextResponse.json({ error: "Forbidden — student only" }, { status: 403 }) };
  return { payload };
}

async function profileGender(userId: string): Promise<HostelGender | null> {
  const student = await Student.findOne({ userId })
    .select("personalDetails.gender")
    .lean<{ personalDetails?: { gender?: string } }>();
  return normalizeGender(student?.personalDetails?.gender);
}

// Room types with prices and free beds (in the student's own gender's rooms), plus their current room.
// When gender isn't on the profile or an earlier booking, the page passes ?gender= from the student's pick.
export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await studentOnly(request);
    if (error) return error;
    await connectDB();

    const [settings, booking, genderOnFile] = await Promise.all([
      getFeeSettings(),
      HostelBooking.findOne({ userId: payload.userId }).lean<IHostelBooking>(),
      profileGender(payload.userId),
    ]);
    const lockedGender = genderOnFile ?? booking?.gender ?? null;
    const gender = lockedGender ?? normalizeGender(new URL(request.url).searchParams.get("gender"));

    const freeBeds = new Map<string, number>();
    if (gender) {
      const groups = await HostelRoom.aggregate<{ _id: { sharing: number; ac: boolean }; free: number }>([
        { $match: { gender, active: true } },
        {
          $group: {
            _id: { sharing: "$sharing", ac: "$ac" },
            free: { $sum: { $max: [0, { $subtract: ["$sharing", "$occupiedBeds"] }] } },
          },
        },
      ]);
      for (const group of groups) freeBeds.set(`${group._id.sharing}-${group._id.ac}`, group.free);
    }

    let current = null;
    if (booking) {
      const room = await HostelRoom.findById(booking.roomId).lean<IHostelRoom>();
      if (room) {
        current = {
          block: room.block,
          roomNumber: room.roomNumber,
          sharing: booking.sharing,
          ac: booking.ac,
          label: hostelTypeLabel(booking.sharing, booking.ac),
          fee: booking.fee,
          occupiedBeds: room.occupiedBeds,
        };
      }
    }

    return NextResponse.json({
      gender,
      genderLocked: Boolean(lockedGender),
      options: HOSTEL_TYPES.map((type) => ({
        sharing: type.sharing,
        ac: type.ac,
        label: hostelTypeLabel(type.sharing, type.ac),
        fee: hostelFeeFor(settings.hostelFees, type.sharing, type.ac),
        bedsLeft: gender ? freeBeds.get(`${type.sharing}-${type.ac}`) ?? 0 : null,
      })),
      booking: current,
      dueDate: settings.hostelDueDate ?? null,
    });
  } catch (error) {
    console.error("student/hostel GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Book a bed of the chosen type, or switch type. The room is picked automatically.
export async function PUT(request: NextRequest) {
  try {
    const { payload, error } = await studentOnly(request);
    if (error) return error;

    const body = await request.json();
    const sharing = Number(body.sharing);
    const ac = body.ac;
    if ((sharing !== 2 && sharing !== 3) || typeof ac !== "boolean") {
      return NextResponse.json({ error: "Pick a room type" }, { status: 400 });
    }

    await connectDB();

    const [existing, genderOnFile, settings] = await Promise.all([
      HostelBooking.findOne({ userId: payload.userId }).lean<IHostelBooking>(),
      profileGender(payload.userId),
      getFeeSettings(),
    ]);
    // Gender on the profile always wins; a student only picks it themselves when it's missing.
    const gender = genderOnFile ?? existing?.gender ?? normalizeGender(body.gender);
    if (!gender) return NextResponse.json({ error: "Choose Boys' or Girls' hostel first" }, { status: 400 });

    if (existing && existing.sharing === sharing && existing.ac === ac) {
      return NextResponse.json({ error: "You already have this room type" }, { status: 400 });
    }

    const fee = hostelFeeFor(settings.hostelFees, sharing, ac);
    if (fee <= 0) {
      return NextResponse.json({ error: "Hostel fees haven't been set yet. Please check back later." }, { status: 400 });
    }

    // Take a bed in the first room of this type with space (atomic, so two students can't take the last bed),
    // and only then free the old bed. If nothing is free, the current room stays as it is.
    const room = await HostelRoom.findOneAndUpdate(
      { gender, sharing, ac, active: true, $expr: { $lt: ["$occupiedBeds", "$sharing"] } },
      { $inc: { occupiedBeds: 1 } },
      { sort: { block: 1, roomNumber: 1 }, new: true }
    ).lean<IHostelRoom>();
    if (!room) return NextResponse.json({ error: "No beds left in this room type" }, { status: 409 });
    const releaseClaimed = () => HostelRoom.updateOne({ _id: room._id, occupiedBeds: { $gt: 0 } }, { $inc: { occupiedBeds: -1 } });

    // Only save if the booking is still the one read above. If another request (e.g. a second tab)
    // changed it in between, give the bed back instead of leaving the bed count out of step.
    let saved = false;
    try {
      if (existing) {
        const result = await HostelBooking.updateOne(
          { _id: existing._id, roomId: existing.roomId },
          { roomId: room._id, gender, sharing, ac, fee }
        );
        saved = result.matchedCount === 1;
      } else {
        await HostelBooking.create({ userId: payload.userId, roomId: room._id, gender, sharing, ac, fee });
        saved = true;
      }
    } catch (saveError) {
      // 11000 = a booking was just created in another tab; the !saved branch below gives the claim back.
      if ((saveError as { code?: number }).code !== 11000) {
        await releaseClaimed();
        throw saveError;
      }
    }
    if (!saved) {
      await releaseClaimed();
      return NextResponse.json({ error: "Your booking just changed. Please refresh and try again." }, { status: 409 });
    }

    if (existing) {
      await HostelRoom.updateOne({ _id: existing.roomId, occupiedBeds: { $gt: 0 } }, { $inc: { occupiedBeds: -1 } });
    }

    await syncDue(payload.userId, "hostel", fee, hostelDueDescription(hostelTypeLabel(sharing, ac), room.block, room.roomNumber));
    return NextResponse.json({ success: true, block: room.block, roomNumber: room.roomNumber });
  } catch (error) {
    console.error("student/hostel PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Give up the hostel room.
export async function DELETE(request: NextRequest) {
  try {
    const { payload, error } = await studentOnly(request);
    if (error) return error;
    await connectDB();

    const booking = await HostelBooking.findOneAndDelete({ userId: payload.userId });
    if (!booking) return NextResponse.json({ error: "You don't have a hostel room" }, { status: 404 });
    await HostelRoom.updateOne({ _id: booking.roomId, occupiedBeds: { $gt: 0 } }, { $inc: { occupiedBeds: -1 } });
    await syncDue(payload.userId, "hostel", 0, "Hostel fee");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("student/hostel DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
