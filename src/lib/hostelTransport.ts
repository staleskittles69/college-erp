// Pure helpers for transport, hostel and fee dues. No database access here, so they can be unit-tested.

export type HostelGender = "boys" | "girls";
export type Sharing = 2 | 3;
export type DueStatus = "paid" | "due" | "overdue";

export interface HostelFees {
  twoAc: number;
  twoNonAc: number;
  threeAc: number;
  threeNonAc: number;
}

export interface BusStop {
  name: string;
  pickupTime: string; // "HH:MM", 24-hour
}

export const HOSTEL_TYPES: { sharing: Sharing; ac: boolean }[] = [
  { sharing: 2, ac: true },
  { sharing: 2, ac: false },
  { sharing: 3, ac: true },
  { sharing: 3, ac: false },
];

export function hostelTypeLabel(sharing: number, ac: boolean): string {
  return `${sharing}-sharing ${ac ? "AC" : "Non-AC"}`;
}

export function hostelFeeFor(fees: HostelFees, sharing: number, ac: boolean): number {
  if (sharing === 2) return ac ? fees.twoAc : fees.twoNonAc;
  return ac ? fees.threeAc : fees.threeNonAc;
}

// What is still owed: the current fee minus everything already paid, never below zero.
export function pendingAmount(fee: number, paidAmounts: number[]): number {
  const paid = paidAmounts.reduce((sum, amount) => sum + amount, 0);
  return Math.max(0, fee - paid);
}

// A due is overdue once the whole due date has passed. Dates are compared by calendar day.
export function dueStatus(pending: number, dueDate: Date | null, today: Date): DueStatus {
  if (pending <= 0) return "paid";
  if (!dueDate) return "due";
  const dueDay = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const todayDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return todayDay > dueDay ? "overdue" : "due";
}

// Gender on a student profile is free text ("Male", "F", "girl", ...). Map it to a hostel side.
export function normalizeGender(value: unknown): HostelGender | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (["m", "male", "boy", "boys", "man"].includes(v)) return "boys";
  if (["f", "female", "girl", "girls", "woman"].includes(v)) return "girls";
  return null;
}

// Room numbers for a bulk add, e.g. ("101", "105") -> ["101", ..., "105"]. Keeps leading zeros.
// Returns null for anything that isn't a sensible numeric range (max 200 rooms at once).
export function roomRange(from: string, to: string): string[] | null {
  if (!/^\d{1,5}$/.test(from) || !/^\d{1,5}$/.test(to)) return null;
  const start = Number(from);
  const end = Number(to);
  if (end < start || end - start >= 200) return null;
  const width = from.length;
  const rooms: string[] = [];
  for (let n = start; n <= end; n++) rooms.push(String(n).padStart(width, "0"));
  return rooms;
}

// Checks a route's stop list; returns an error message, or null when it's fine.
export function validateStops(stops: unknown): string | null {
  if (!Array.isArray(stops) || stops.length === 0) return "Add at least one stop";
  const names = new Set<string>();
  for (const stop of stops) {
    const name = typeof stop?.name === "string" ? stop.name.trim() : "";
    const time = typeof stop?.pickupTime === "string" ? stop.pickupTime.trim() : "";
    if (!name) return "Every stop needs a name";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return `Pickup time for "${name}" must be HH:MM`;
    const key = name.toLowerCase();
    if (names.has(key)) return `Stop "${name}" is listed twice`;
    names.add(key);
  }
  return null;
}

// "07:45" -> "7:45 AM"
export function formatPickupTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
