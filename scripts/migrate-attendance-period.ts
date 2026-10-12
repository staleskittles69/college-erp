/**
 * One-time fix: attendance is now saved per period, so a subject taught twice in a day
 * (e.g. a two-period lab) keeps a record for each period. The old unique index allowed only
 * one record per student + date + subject and has to be replaced, or saving the second
 * period fails.
 *
 * Existing records are left as they are (they have no period).
 *
 * Dry run:  npx tsx scripts/migrate-attendance-period.ts
 * Apply:    npx tsx scripts/migrate-attendance-period.ts --apply
 * Uses MONGODB_URI from the environment, else from .env.local. Safe to re-run.
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
const APPLY = process.argv.includes("--apply");
const OLD_INDEX = "studentId_1_date_1_subject_1";
const NEW_INDEX = "studentId_1_date_1_subject_1_period_1";

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not set (environment or .env.local)");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  const attendances = mongoose.connection.db!.collection("attendances");
  console.log(`Database: ${mongoose.connection.db!.databaseName} (${APPLY ? "APPLY" : "dry run"})`);

  const indexNames = (await attendances.indexes()).map((index) => index.name);
  const withoutPeriod = await attendances.countDocuments({ period: { $exists: false } });
  console.log(`Records without a period (kept as they are): ${withoutPeriod}`);
  console.log(`Old index ${OLD_INDEX}: ${indexNames.includes(OLD_INDEX) ? "present (will be dropped)" : "already gone"}`);
  console.log(`New index ${NEW_INDEX}: ${indexNames.includes(NEW_INDEX) ? "already present" : "missing (will be created)"}`);

  if (!APPLY) {
    console.log("\nDry run only — nothing changed. Re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  if (!indexNames.includes(NEW_INDEX)) {
    await attendances.createIndex({ studentId: 1, date: 1, subject: 1, period: 1 }, { name: NEW_INDEX, unique: true });
  }
  if (indexNames.includes(OLD_INDEX)) await attendances.dropIndex(OLD_INDEX);

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
});
