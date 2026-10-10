import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BusRoute, { IBusRoute } from "@/models/BusRoute";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { validateStops } from "@/lib/hostelTransport";
import { cleanStops, serializeRoute } from "@/lib/busRoutes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    const routes = await BusRoute.find().sort({ routeNumber: 1 }).lean<IBusRoute[]>();
    return NextResponse.json(routes.map(serializeRoute));
  } catch (error) {
    console.error("Bus routes GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { routeNumber, name, stops, annualFee, capacity } = await request.json();
    if (typeof routeNumber !== "string" || !routeNumber.trim() || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Route number and name are required" }, { status: 400 });
    }
    const stopsError = validateStops(stops);
    if (stopsError) return NextResponse.json({ error: stopsError }, { status: 400 });
    if (!Number.isFinite(annualFee) || annualFee < 0) return NextResponse.json({ error: "Enter a valid yearly fee" }, { status: 400 });
    if (!Number.isInteger(capacity) || capacity < 1) return NextResponse.json({ error: "Seats must be at least 1" }, { status: 400 });

    await connectDB();

    if (await BusRoute.exists({ routeNumber: routeNumber.trim() })) {
      return NextResponse.json({ error: `Route ${routeNumber.trim()} already exists` }, { status: 400 });
    }

    const route = await BusRoute.create({
      routeNumber: routeNumber.trim(),
      name: name.trim(),
      stops: cleanStops(stops),
      annualFee,
      capacity,
    });

    await logAudit(payload, "create", "BusRoute", `Created bus route ${route.routeNumber} (${route.name})`, route._id.toString());
    return NextResponse.json(serializeRoute(route.toObject() as IBusRoute));
  } catch (error) {
    console.error("Bus routes POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
