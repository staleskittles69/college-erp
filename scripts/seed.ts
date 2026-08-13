/**
 * Seed script: creates a default admin user and an optional student.
 * Run: npm run seed
 * Requires MONGODB_URI and JWT_SECRET in .env.local (or env).
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { formatRollNo, rollNoToEmail } from "../src/lib/utils/rollNumber";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const User = (await import("../src/models/User")).default;
  const Student = (await import("../src/models/Student")).default;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@college.edu";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log("Admin user already exists:", adminEmail);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });
    console.log("Created admin:", adminEmail, "(password:", adminPassword + ")");
  }

  const studentBranch = "CSE";
  const studentYear = 2; // semester 3 → year 2
  const studentRollNo = formatRollNo(studentBranch, studentYear, 1);
  const studentEmail = process.env.SEED_STUDENT_EMAIL ?? rollNoToEmail(studentRollNo);
  const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "student123";

  const existingUser = await User.findOne({ email: studentEmail });
  if (existingUser) {
    console.log("Student user already exists:", studentEmail);
  } else {
    const hashedPassword = await bcrypt.hash(studentPassword, 10);
    const user = await User.create({
      name: "Sample Student",
      email: studentEmail,
      rollNumber: 1,
      branch: studentBranch,
      year: studentYear,
      section: "Section 1",
      password: hashedPassword,
      role: "student",
    });
    const student = await Student.create({
      userId: user._id,
      name: "Sample Student",
      rollNo: studentRollNo,
      branch: studentBranch,
      semester: 3,
      section: "Section 1",
    });
    await User.findByIdAndUpdate(user._id, { studentId: student._id });
    console.log("Created student:", studentEmail, "(password:", studentPassword + ")");
  }

  const teacherEmail = process.env.SEED_TEACHER_EMAIL ?? "teacher@college.edu";
  const teacherPassword = process.env.SEED_TEACHER_PASSWORD ?? "teacher123";

  const existingTeacher = await User.findOne({ email: teacherEmail });
  if (existingTeacher) {
    console.log("Teacher user already exists:", teacherEmail);
  } else {
    const hashedPassword = await bcrypt.hash(teacherPassword, 10);
    await User.create({
      email: teacherEmail,
      password: hashedPassword,
      role: "teacher",
    });
    console.log("Created teacher:", teacherEmail, "(password:", teacherPassword + ")");
  }

  await mongoose.disconnect();
  console.log("Seed done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
