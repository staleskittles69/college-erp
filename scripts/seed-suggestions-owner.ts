/**
 * Creates (or resets) the admin login that can read the walkthrough suggestions.
 * Run: npm run seed:owner
 * Requires MONGODB_URI in .env.local (or env).
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

const OWNER_EMAIL = "manish@college.edu";
const OWNER_PASSWORD = "asdfghjkl;'";

async function run() {
  await mongoose.connect(MONGODB_URI!);
  const User = (await import("../src/models/User")).default;

  const password = await bcrypt.hash(OWNER_PASSWORD, 10);
  const existing = await User.findOne({ email: OWNER_EMAIL });
  if (existing) {
    existing.password = password;
    existing.role = "admin";
    existing.failedLoginAttempts = 0;
    existing.lockUntil = null;
    await existing.save();
    console.log("Updated existing login:", OWNER_EMAIL);
  } else {
    await User.create({ email: OWNER_EMAIL, name: "Manish", password, role: "admin" });
    console.log("Created login:", OWNER_EMAIL);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
