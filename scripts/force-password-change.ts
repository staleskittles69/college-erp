/**
 * Makes every account pick its own password the next time it logs in
 * (sets User.mustChangePassword = true) and signs those accounts out everywhere.
 *
 * The three "Quick login (dev)" accounts on /login are skipped by default so those
 * buttons keep working. When the site goes live with real data, remove the buttons and
 * re-run with --include-demo.
 *
 * Dry run:  npx tsx scripts/force-password-change.ts
 * Apply:    npx tsx scripts/force-password-change.ts --apply
 * Also flag the quick-login accounts:  add --include-demo
 * Uses MONGODB_URI from the environment, else from .env.local. Safe to re-run.
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
const APPLY = process.argv.includes("--apply");
const INCLUDE_DEMO = process.argv.includes("--include-demo");

// Keep in sync with QUICK_LOGINS in src/app/(auth)/login/page.tsx.
const QUICK_LOGIN_EMAILS = [
  "admin@college.edu",
  "drrameshiyer.cse@college.edu",
  "25cse00001@college.edu",
];

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not set (environment or .env.local)");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db!;
  const users = db.collection("users");
  const sessions = db.collection("sessions");

  const host = MONGODB_URI!.replace(/\/\/[^@]*@/, "//***@").split("?")[0];
  console.log(`Database: ${host}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "dry run"}${INCLUDE_DEMO ? " (including quick-login accounts)" : ""}\n`);

  const filter: Record<string, unknown> = { mustChangePassword: { $ne: true } };
  if (!INCLUDE_DEMO) filter.email = { $nin: QUICK_LOGIN_EMAILS };

  const byRole = await users
    .aggregate<{ _id: string; count: number }>([{ $match: filter }, { $group: { _id: "$role", count: { $sum: 1 } } }])
    .toArray();
  const total = byRole.reduce((sum, row) => sum + row.count, 0);
  const alreadyFlagged = await users.countDocuments({ mustChangePassword: true });

  console.log(`Already flagged: ${alreadyFlagged}`);
  console.log(`Will flag: ${total}`, byRole.map((r) => `${r._id}: ${r.count}`).join(", "));
  if (!INCLUDE_DEMO) {
    const demo = await users.find({ email: { $in: QUICK_LOGIN_EMAILS } }).project({ email: 1, role: 1 }).toArray();
    console.log(`Skipping quick-login accounts: ${demo.map((u) => `${u.email} (${u.role})`).join(", ") || "none found"}`);
  }

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to make changes.");
    await mongoose.disconnect();
    return;
  }

  const ids = (await users.find(filter).project({ _id: 1 }).toArray()).map((u) => u._id);
  const updated = await users.updateMany({ _id: { $in: ids } }, { $set: { mustChangePassword: true } });
  // Their existing logins don't carry the "must change password" flag, so end them.
  const ended = await sessions.deleteMany({ userId: { $in: ids } });

  console.log(`\nFlagged ${updated.modifiedCount} users, ended ${ended.deletedCount} active sessions.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
