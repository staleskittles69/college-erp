import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import BusRoute, { IBusRoute } from "@/models/BusRoute";
import TransportBooking, { ITransportBooking } from "@/models/TransportBooking";
import { getAuth } from "@/lib/api-auth";
import { getFeeSettings, syncDue, transportDueDescription } from "@/lib/feeDues";
import { toIdString } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function studentOnly(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (payload.role !== "student") return { error: NextResponse.json({ error: "Forbidden — student only" }, { status: 403 }) };
  return { payload };
}

// Routes on offer plus the student's current booking.
export async function GET(request: NextRequest) {
  try {
    const { payload, error } = await studentOnly(request);
    if (error) return error;
    await connectDB();

    const [routes, booking, settings] = await Promise.all([
      BusRoute.find({ active: true }).sort({ routeNumber: 1 }).lean<IBusRoute[]>(),
      TransportBooking.findOne({ userId: payload.userId }).lean<ITransportBooking>(),
      getFeeSettings(),
    ]);

    let current = null;
    if (booking) {
      // The booked route may since have been switched off, so look it up directly rather than in `routes`.
      const route = await BusRoute.findById(booking.routeId).lean<IBusRoute>();
      if (route) {
        current = {
          routeId: toIdString(route._id),
          routeNumber: route.routeNumber,
          routeName: route.name,
          stopName: booking.stopName,
          pickupTime: route.stops.find((stop) => stop.name === booking.stopName)?.pickupTime ?? null,
          fee: booking.fee,
        };
      }
    }

    return NextResponse.json({
      routes: routes.map((route) => ({
        id: toIdString(route._id),
        routeNumber: route.routeNumber,
        name: route.name,
        stops: route.stops,
        annualFee: route.annualFee,
        seatsLeft: Math.max(0, route.capacity - route.bookedSeats),
      })),
      booking: current,
      dueDate: settings.transportDueDate ?? null,
    });
  } catch (error) {
    console.error("student/transport GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Book a seat, or switch route/stop.
export async function PUT(request: NextRequest) {
  try {
    const { payload, error } = await studentOnly(request);
    if (error) return error;

    const { routeId, stopName } = await request.json();
    if (typeof routeId !== "string" || !mongoose.Types.ObjectId.isValid(routeId) || typeof stopName !== "string" || !stopName) {
      return NextResponse.json({ error: "Pick a route and a stop" }, { status: 400 });
    }

    await connectDB();

    const route = await BusRoute.findById(routeId).lean<IBusRoute>();
    if (!route || !route.active) return NextResponse.json({ error: "This route isn't available" }, { status: 404 });
    if (!route.stops.some((stop) => stop.name === stopName)) {
      return NextResponse.json({ error: "That stop isn't on this route" }, { status: 400 });
    }

    const existing = await TransportBooking.findOne({ userId: payload.userId }).lean<ITransportBooking>();
    const sameRoute = existing && toIdString(existing.routeId) === routeId;

    if (sameRoute) {
      // Only the stop changes: same seat, same fee.
      if (existing.stopName === stopName) return NextResponse.json({ error: "You're already booked on this stop" }, { status: 400 });
      await TransportBooking.updateOne({ _id: existing._id }, { stopName });
      await syncDue(payload.userId, "transport", existing.fee, transportDueDescription(route.routeNumber, route.name, stopName));
      return NextResponse.json({ success: true });
    }

    // Claim a seat on the new bus first (atomic, so two students can't take the last seat),
    // and only then let go of the old one. If the bus is full, the current booking stays as it is.
    const claimed = await BusRoute.findOneAndUpdate(
      { _id: routeId, active: true, $expr: { $lt: ["$bookedSeats", "$capacity"] } },
      { $inc: { bookedSeats: 1 } },
      { new: true }
    );
    if (!claimed) return NextResponse.json({ error: "This bus is full" }, { status: 409 });
    const releaseClaimed = () => BusRoute.updateOne({ _id: routeId, bookedSeats: { $gt: 0 } }, { $inc: { bookedSeats: -1 } });

    // Only save if the booking is still the one read above. If another request (e.g. a second tab)
    // changed it in between, give the seat back instead of leaving the seat count out of step.
    let saved = false;
    try {
      if (existing) {
        const result = await TransportBooking.updateOne(
          { _id: existing._id, routeId: existing.routeId },
          { routeId, stopName, fee: route.annualFee }
        );
        saved = result.matchedCount === 1;
      } else {
        await TransportBooking.create({ userId: payload.userId, routeId, stopName, fee: route.annualFee });
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
      await BusRoute.updateOne({ _id: existing.routeId, bookedSeats: { $gt: 0 } }, { $inc: { bookedSeats: -1 } });
    }

    await syncDue(payload.userId, "transport", route.annualFee, transportDueDescription(route.routeNumber, route.name, stopName));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("student/transport PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Cancel transport.
export async function DELETE(request: NextRequest) {
  try {
    const { payload, error } = await studentOnly(request);
    if (error) return error;
    await connectDB();

    const booking = await TransportBooking.findOneAndDelete({ userId: payload.userId });
    if (!booking) return NextResponse.json({ error: "You don't have a bus booking" }, { status: 404 });
    await BusRoute.updateOne({ _id: booking.routeId, bookedSeats: { $gt: 0 } }, { $inc: { bookedSeats: -1 } });
    await syncDue(payload.userId, "transport", 0, "Bus fee");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("student/transport DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
