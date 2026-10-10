import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import BusRoute, { IBusRoute, IBusStop } from "@/models/BusRoute";
import TransportBooking from "@/models/TransportBooking";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { validateStops } from "@/lib/hostelTransport";
import { cleanStops, serializeRoute } from "@/lib/busRoutes";
import { toIdString } from "@/lib/utils";
import { rollNumbersFor } from "@/lib/studentRollNumbers";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type PassengerUser = { _id: mongoose.Types.ObjectId; name?: string; branch?: string; year?: number; section?: string };

// The route plus everyone booked on it.
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await connectDB();
    const route = await BusRoute.findById(id).lean<IBusRoute>();
    if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

    const bookings = await TransportBooking.find({ routeId: id })
      .populate("userId", "name branch year section")
      .lean();
    const rolls = await rollNumbersFor(bookings.map((booking) => (booking.userId as unknown as PassengerUser | null)?._id ?? booking.userId));

    return NextResponse.json({
      ...serializeRoute(route),
      passengers: bookings
        .map((booking) => {
          const user = booking.userId as unknown as PassengerUser | null;
          return {
            id: toIdString(booking._id),
            name: user?.name ?? "Unknown",
            rollNumber: user ? rolls.get(user._id.toString()) ?? "" : "",
            className: user ? `${user.branch ?? ""} Y${user.year ?? ""} ${user.section ?? ""}`.trim() : "",
            stopName: booking.stopName,
          };
        })
        .sort((a, b) => a.stopName.localeCompare(b.stopName) || a.rollNumber.localeCompare(b.rollNumber)),
    });
  } catch (error) {
    console.error("Bus route GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Edit a route. Fee changes only apply to new bookings; existing students keep the fee they booked at.
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    await connectDB();

    const route = await BusRoute.findById(id);
    if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

    if (body.routeNumber !== undefined) {
      const routeNumber = String(body.routeNumber).trim();
      if (!routeNumber) return NextResponse.json({ error: "Route number is required" }, { status: 400 });
      if (routeNumber !== route.routeNumber && (await BusRoute.exists({ routeNumber }))) {
        return NextResponse.json({ error: `Route ${routeNumber} already exists` }, { status: 400 });
      }
      route.routeNumber = routeNumber;
    }
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Route name is required" }, { status: 400 });
      route.name = name;
    }
    if (body.stops !== undefined) {
      const stopsError = validateStops(body.stops);
      if (stopsError) return NextResponse.json({ error: stopsError }, { status: 400 });
      const stops = cleanStops(body.stops as IBusStop[]);
      // Don't strand anyone: a stop with students booked on it can't be removed.
      const kept = new Set(stops.map((stop) => stop.name));
      const stranded = await TransportBooking.find({ routeId: id, stopName: { $nin: [...kept] } }).select("stopName").lean<{ stopName: string }[]>();
      if (stranded.length > 0) {
        const names = [...new Set(stranded.map((booking) => booking.stopName))].join(", ");
        return NextResponse.json({ error: `Students are booked at ${names}. Keep that stop or move them first.` }, { status: 400 });
      }
      route.stops = stops;
    }
    if (body.annualFee !== undefined) {
      if (!Number.isFinite(body.annualFee) || body.annualFee < 0) return NextResponse.json({ error: "Enter a valid yearly fee" }, { status: 400 });
      route.annualFee = body.annualFee;
    }
    if (body.capacity !== undefined) {
      if (!Number.isInteger(body.capacity) || body.capacity < 1) return NextResponse.json({ error: "Seats must be at least 1" }, { status: 400 });
      if (body.capacity < route.bookedSeats) {
        return NextResponse.json({ error: `${route.bookedSeats} students are already booked, so seats can't go below that` }, { status: 400 });
      }
      route.capacity = body.capacity;
    }
    if (body.active !== undefined) route.active = Boolean(body.active);

    await route.save();
    await logAudit(payload, "update", "BusRoute", `Updated bus route ${route.routeNumber} (${route.name})`, id);
    return NextResponse.json(serializeRoute(route.toObject() as IBusRoute));
  } catch (error) {
    console.error("Bus route PATCH error:", error);
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
    const booked = await TransportBooking.countDocuments({ routeId: id });
    if (booked > 0) {
      return NextResponse.json(
        { error: `${booked} student${booked === 1 ? " is" : "s are"} booked on this route. Switch it off instead, or wait until they move.` },
        { status: 400 }
      );
    }

    const deleted = await BusRoute.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Route not found" }, { status: 404 });

    await logAudit(payload, "delete", "BusRoute", `Deleted bus route ${deleted.routeNumber} (${deleted.name})`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bus route DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
