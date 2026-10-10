import FeeDue from "@/models/FeeDue";
import FeeSettings, { IFeeSettings } from "@/models/FeeSettings";
import { hostelTypeLabel, pendingAmount } from "@/lib/hostelTransport";
import TransportBooking, { ITransportBooking } from "@/models/TransportBooking";
import BusRoute, { IBusRoute } from "@/models/BusRoute";
import HostelBooking, { IHostelBooking } from "@/models/HostelBooking";
import HostelRoom, { IHostelRoom } from "@/models/HostelRoom";

// Callers must have already run connectDB() before using anything in this file.

// Always the oldest settings document, so readers and the admin save agree on the same one even if
// two first-ever requests raced and each created one.
export async function getFeeSettings(): Promise<IFeeSettings> {
  const existing = await FeeSettings.findOne().sort({ createdAt: 1, _id: 1 }).lean<IFeeSettings>();
  if (existing) return existing;
  const created = await FeeSettings.create({});
  return created.toObject() as IFeeSettings;
}

// Brings a student's dues for one fee type in line with what they've currently booked.
// Paid dues are never touched; the single pending due is recreated as (current fee − everything paid).
// So switching before paying changes the amount, upgrading after paying adds just the difference,
// and cancelling removes whatever is still pending.
export async function syncDue(
  userId: string,
  type: "hostel" | "transport",
  currentFee: number,
  description: string
): Promise<void> {
  const paid = await FeeDue.find({ userId, type, status: "paid" }).select("amount").lean<{ amount: number }[]>();
  const owed = pendingAmount(currentFee, paid.map((due) => due.amount));

  await FeeDue.deleteMany({ userId, type, status: "pending" });
  if (owed > 0) {
    await FeeDue.create({
      userId,
      type,
      description: paid.length > 0 ? `${description} (balance after earlier payment)` : description,
      amount: owed,
      status: "pending",
    });
  }
}

export function transportDueDescription(routeNumber: string, routeName: string, stopName: string): string {
  return `Bus fee — Route ${routeNumber} (${routeName}), ${stopName} stop`;
}

export function hostelDueDescription(typeLabel: string, block: string, roomNumber: string): string {
  return `Hostel fee — ${typeLabel}, Block ${block} Room ${roomNumber}`;
}

// Re-runs syncDue from whatever the student has booked right now (used after an admin undoes a payment).
export async function resyncFromBooking(userId: string, type: "hostel" | "transport"): Promise<void> {
  if (type === "transport") {
    const booking = await TransportBooking.findOne({ userId }).lean<ITransportBooking>();
    const route = booking ? await BusRoute.findById(booking.routeId).lean<IBusRoute>() : null;
    await syncDue(
      userId,
      "transport",
      booking?.fee ?? 0,
      booking && route ? transportDueDescription(route.routeNumber, route.name, booking.stopName) : "Bus fee"
    );
    return;
  }
  const booking = await HostelBooking.findOne({ userId }).lean<IHostelBooking>();
  const room = booking ? await HostelRoom.findById(booking.roomId).lean<IHostelRoom>() : null;
  await syncDue(
    userId,
    "hostel",
    booking?.fee ?? 0,
    booking && room ? hostelDueDescription(hostelTypeLabel(booking.sharing, booking.ac), room.block, room.roomNumber) : "Hostel fee"
  );
}
