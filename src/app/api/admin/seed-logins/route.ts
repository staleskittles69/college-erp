import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

// POST /api/admin/seed-logins
// Body: { branch, year, sections: ["Section 1", "Section 2"] }
// Assigns roll{n}@college.edu + password "student123" to students missing an email.
export async function POST(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { branch, year, sections } = await request.json();
  if (!branch || !year || !Array.isArray(sections) || sections.length === 0)
    return NextResponse.json({ error: "branch, year, and sections[] are required" }, { status: 400 });

  await connectDB();

  const students = await User.find({
    role: "student",
    branch,
    year: Number(year),
    section: { $in: sections },
    $or: [
      { email: { $exists: false } },
      { email: null },
      { email: "" },
      { password: { $exists: false } },
      { password: null },
      { password: "" },
    ],
  }).lean();

  if (students.length === 0)
    return NextResponse.json({ message: "All students in these sections already have logins.", updated: 0 });

  const hashedPassword = await hashPassword("student123");
  const loginUpdates = students.map((student) => ({
    updateOne: {
      filter: { _id: student._id },
      update: {
        $set: {
          email: `roll${student.rollNumber}@college.edu`,
          password: hashedPassword,
        },
      },
    },
  }));

  await User.bulkWrite(loginUpdates);

  const sample = students.slice(0, 5).map((student) => ({
    name: student.name,
    email: `roll${student.rollNumber}@college.edu`,
    password: "student123",
    section: student.section,
  }));

  return NextResponse.json({
    message: `Created logins for ${students.length} students.`,
    updated: students.length,
    sample,
    note: "All students use password: student123",
  });
}
