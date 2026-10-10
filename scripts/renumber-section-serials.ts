/**
 * One-time fix: make User.rollNumber the student's serial number within their section
 * (1, 2, 3 … in every section). It used to keep counting across the whole branch+year
 * (Section 2 started at 61). Order inside each section is kept.
 *
 * Only User.rollNumber changes — academic roll numbers (Student.rollNo), emails and logins don't.
 *
 * Dry run:  npx tsx scripts/renumber-section-serials.ts
 * Apply:    npx tsx scripts/renumber-section-serials.ts --apply
 * Uses MONGODB_URI from the environment, else from .env.local. Safe to re-run.
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
const APPLY = process.argv.includes("--apply");
const OLD_INDEX = "branch_1_year_1_rollNumber_1";
const NEW_INDEX = "branch_1_year_1_section_1_rollNumber_1";

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not set (environment or .env.local)");
  process.exit(1);
}

interface StudentUser {
  _id: mongoose.Types.ObjectId;
  branch: string;
  year: number;
  section: string;
  rollNumber?: number;
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  const users = mongoose.connection.db!.collection("users");
  console.log(`Database: ${mongoose.connection.db!.databaseName} (${APPLY ? "APPLY" : "dry run"})`);

  const students = await users
    .find({ role: "student" }, { projection: { branch: 1, year: 1, section: 1, rollNumber: 1 } })
    .sort({ branch: 1, year: 1, section: 1, rollNumber: 1, _id: 1 })
    .toArray() as unknown as StudentUser[];

  const nextSerial = new Map<string, number>();
  const updates: { updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { rollNumber: number } } } }[] = [];
  for (const student of students) {
    const sectionKey = `${student.branch}|${student.year}|${student.section}`;
    const serial = (nextSerial.get(sectionKey) ?? 0) + 1;
    nextSerial.set(sectionKey, serial);
    if (student.rollNumber !== serial) {
      updates.push({ updateOne: { filter: { _id: student._id }, update: { $set: { rollNumber: serial } } } });
    }
  }

  const indexNames = (await users.indexes()).map((index) => index.name);
  console.log(`Students: ${students.length} in ${nextSerial.size} sections`);
  console.log(`Serial numbers to change: ${updates.length}`);
  console.log(`Old index ${OLD_INDEX}: ${indexNames.includes(OLD_INDEX) ? "present (will be dropped)" : "already gone"}`);
  console.log(`New index ${NEW_INDEX}: ${indexNames.includes(NEW_INDEX) ? "already present" : "missing (will be created)"}`);

  if (!APPLY) {
    console.log("\nDry run only — nothing changed. Re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  // The old index must go first: once renumbered, Section 1 and Section 2 both have serial 1.
  if (indexNames.includes(OLD_INDEX)) await users.dropIndex(OLD_INDEX);

  const BATCH = 1000;
  for (let start = 0; start < updates.length; start += BATCH) {
    await users.bulkWrite(updates.slice(start, start + BATCH), { ordered: false });
    process.stdout.write(`\r  Updated ${Math.min(start + BATCH, updates.length)} / ${updates.length}`);
  }
  if (updates.length) process.stdout.write("\n");

  if (!indexNames.includes(NEW_INDEX)) {
    await users.createIndex(
      { branch: 1, year: 1, section: 1, rollNumber: 1 },
      { name: NEW_INDEX, unique: true, partialFilterExpression: { role: "student" } }
    );
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Renumber failed:", error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
});
