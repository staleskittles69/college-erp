import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateRollNumber } from "@/lib/utils/generateRollNumber";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Drop stale indexes safely
    for (const idx of ["email_1"]) {
      try { await mongoose.connection.collection("users").dropIndex(idx); } catch { /* ok */ }
    }

    const log: string[] = [];

    // ── ADMIN ──────────────────────────────────────────────────────────────
    let admin = await User.findOne({ role: "admin" });
    if (admin) {
      if (!admin.email) {
        await User.updateOne({ _id: admin._id }, { $set: { email: "admin@college.edu" } });
        log.push("patched admin email → admin@college.edu");
      } else {
        log.push(`admin already has email: ${admin.email}`);
      }
    } else {
      await User.create({ name: "Admin", email: "admin@college.edu", password: "admin123", role: "admin" });
      log.push("created admin (admin@college.edu / admin123)");
    }

    // ── TEACHER ────────────────────────────────────────────────────────────
    let teacher = await User.findOne({ role: "teacher" });
    if (teacher) {
      if (!teacher.email) {
        await User.updateOne({ _id: teacher._id }, { $set: { email: "teacher@college.edu" } });
        log.push("patched teacher email → teacher@college.edu");
      } else {
        log.push(`teacher already has email: ${teacher.email}`);
      }
    } else {
      await User.create({ name: "Test Teacher", email: "teacher@college.edu", password: "teacher123", role: "teacher" });
      log.push("created teacher (teacher@college.edu / teacher123)");
    }

    // ── STUDENT ────────────────────────────────────────────────────────────
    let student = await User.findOne({ role: "student" });
    if (student) {
      if (!student.email) {
        await User.updateOne({ _id: student._id }, { $set: { email: "student@college.edu" } });
        log.push("patched student email → student@college.edu");
      } else {
        log.push(`student already has email: ${student.email}`);
      }
    } else {
      const rollNumber = await generateRollNumber();
      await User.create({
        name: "Test Student",
        email: "student@college.edu",
        rollNumber,
        branch: "CSE",
        year: 1,
        section: "A",
        password: "student123",
        role: "student",
      });
      log.push(`created student (student@college.edu / student123, roll: ${rollNumber})`);
    }

    const users = await User.find({}).select("-password").lean();
    return NextResponse.json({ log, users });

  } catch (err) {
    console.error("setup-initial-data error:", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}
