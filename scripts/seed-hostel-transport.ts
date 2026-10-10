/**
 * Demo data for transport, hostel and fee dues:
 * 6 bus routes, a boys' block (A) and a girls' block (B) with every room type, and the fee settings.
 *
 * WIPES all bus routes, hostel rooms, bookings and fee dues before inserting.
 *
 * Run: npx tsx scripts/seed-hostel-transport.ts
 * Requires MONGODB_URI in .env.local
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

const ROUTES = [
  {
    routeNumber: "1", name: "Vijayawada – Benz Circle", annualFee: 32000, capacity: 50,
    stops: [["Benz Circle", "07:00"], ["Ramavarappadu", "07:10"], ["Enikepadu", "07:20"], ["Gannavaram", "07:35"], ["College", "08:30"]],
  },
  {
    routeNumber: "2", name: "Vijayawada – Bus Stand", annualFee: 30000, capacity: 50,
    stops: [["PNBS Bus Stand", "07:05"], ["Krishna Lanka", "07:15"], ["Tadepalli", "07:30"], ["Mangalagiri", "07:50"], ["College", "08:30"]],
  },
  {
    routeNumber: "3", name: "Guntur – Brodipet", annualFee: 26000, capacity: 45,
    stops: [["Brodipet", "07:20"], ["Lakshmipuram", "07:30"], ["Amaravati Road", "07:45"], ["College", "08:30"]],
  },
  {
    routeNumber: "4", name: "Guntur – Arundelpet", annualFee: 26000, capacity: 45,
    stops: [["Arundelpet", "07:15"], ["Naaz Center", "07:25"], ["Pedakakani", "07:45"], ["College", "08:30"]],
  },
  {
    routeNumber: "5", name: "Tenali", annualFee: 34000, capacity: 40,
    stops: [["Tenali Bus Stand", "06:50"], ["Kollipara", "07:10"], ["Duggirala", "07:30"], ["College", "08:30"]],
  },
  {
    routeNumber: "6", name: "Chilakaluripet", annualFee: 36000, capacity: 40,
    stops: [["Chilakaluripet", "06:45"], ["Yadlapadu", "07:05"], ["Pedanandipadu", "07:25"], ["College", "08:30"]],
  },
];

// Floors 1 and 2 of each block: 10 rooms of each type.
const ROOM_PLAN = [
  { from: 101, to: 110, sharing: 2, ac: true },
  { from: 111, to: 120, sharing: 2, ac: false },
  { from: 201, to: 210, sharing: 3, ac: true },
  { from: 211, to: 220, sharing: 3, ac: false },
];

const BLOCKS = [
  { block: "A", gender: "boys" },
  { block: "B", gender: "girls" },
];

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const BusRoute = (await import("../src/models/BusRoute")).default;
  const HostelRoom = (await import("../src/models/HostelRoom")).default;
  const TransportBooking = (await import("../src/models/TransportBooking")).default;
  const HostelBooking = (await import("../src/models/HostelBooking")).default;
  const FeeDue = (await import("../src/models/FeeDue")).default;
  const FeeSettings = (await import("../src/models/FeeSettings")).default;

  console.log("Wiping existing transport, hostel and fee data...");
  await Promise.all([
    BusRoute.deleteMany({}),
    HostelRoom.deleteMany({}),
    TransportBooking.deleteMany({}),
    HostelBooking.deleteMany({}),
    FeeDue.deleteMany({}),
    FeeSettings.deleteMany({}),
  ]);

  await BusRoute.insertMany(
    ROUTES.map((route) => ({
      ...route,
      stops: route.stops.map(([name, pickupTime]) => ({ name, pickupTime })),
    }))
  );
  console.log(`Inserted ${ROUTES.length} bus routes`);

  const rooms = BLOCKS.flatMap(({ block, gender }) =>
    ROOM_PLAN.flatMap(({ from, to, sharing, ac }) =>
      Array.from({ length: to - from + 1 }, (_, i) => ({ block, gender, roomNumber: String(from + i), sharing, ac }))
    )
  );
  await HostelRoom.insertMany(rooms);
  console.log(`Inserted ${rooms.length} hostel rooms (Block A boys, Block B girls)`);

  await FeeSettings.create({
    hostelFees: { twoAc: 95000, twoNonAc: 75000, threeAc: 80000, threeNonAc: 60000 },
    hostelDueDate: new Date("2026-11-15T00:00:00Z"),
    transportDueDate: new Date("2026-11-30T00:00:00Z"),
  });
  console.log("Saved fee settings");

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
