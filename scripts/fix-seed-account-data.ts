/**
 * One-off cleanup for the two nameless accounts created by the original seed.ts
 * bootstrap (before it set a `name` field): gives admin@college.edu a real name,
 * and deletes the unused teacher@college.edu placeholder (no Teacher profile,
 * not wired to anything — the real seeded branch teachers are unaffected).
 * Idempotent: safe to run more than once.
 * Run: npx tsx scripts/fix-seed-account-data.ts
 * Requires MONGODB_URI in .env.local (or env).
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

async function run() {
  await mongoose.connect(MONGODB_URI!);

  const User = (await import("../src/models/User")).default;
  const Teacher = (await import("../src/models/Teacher")).default;
  const { removeUserFromGroupConversation } = await import("../src/lib/messaging");

  const admin = await User.findOne({ email: "admin@college.edu" });
  if (!admin) {
    console.log("No admin@college.edu account found — skipping.");
  } else if (admin.name) {
    console.log(`admin@college.edu already has a name ("${admin.name}") — skipping.`);
  } else {
    admin.name = "Manish";
    await admin.save();
    console.log('Set admin@college.edu name to "Manish".');
  }

  const genericTeacher = await User.findOne({ email: "teacher@college.edu" });
  if (!genericTeacher) {
    console.log("No teacher@college.edu account found — already cleaned up.");
  } else {
    const profile = await Teacher.findOne({ userId: genericTeacher._id });
    if (profile) {
      console.warn(
        `teacher@college.edu has a Teacher profile (${profile._id}) — NOT deleting, this account is in use.`
      );
    } else {
      await User.findByIdAndDelete(genericTeacher._id);
      await removeUserFromGroupConversation(genericTeacher._id.toString());
      console.log("Deleted unused teacher@college.edu account and removed it from the All Staff conversation.");
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Fix script failed:", err);
  process.exit(1);
});
