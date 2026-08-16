import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Student from "@/models/Student";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { generateRollNumber } from "@/lib/utils/generateRollNumber";
import { formatRollNo, rollNoToEmail } from "@/lib/utils/rollNumber";
import { toIdString } from "@/lib/utils";
import { escapeRegex } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (payload.role !== "admin" && payload.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const year = searchParams.get("year");
    const section = searchParams.get("section");

    const search = searchParams.get("search");

    const filter: Record<string, unknown> = { role: "student" };
    if (search) {
      const safeSearch = escapeRegex(search);

      // rollNo lives on the Student document, not User, so a roll-number
      // search needs a separate lookup merged into the User query.
      const matchingStudents = await Student.find({
        rollNo: { $regex: safeSearch, $options: "i" },
      })
        .select("userId")
        .lean();
      const matchingUserIds = matchingStudents.map((s) => s.userId);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { _id: { $in: matchingUserIds } },
      ];
    } else {
      if (branch) filter.branch = branch;
      if (section) filter.section = section;
      if (year) filter.year = parseInt(year, 10);
      else if (semester) filter.year = Math.ceil(parseInt(semester, 10) / 2);
    }

    const students = await User.find(filter)
      .select("-password")
      .sort({ rollNumber: 1 })
      .limit(search ? 10 : 0)
      .lean();

    // rollNo shown to admins is always the human-entered Student.rollNo,
    // never the auto-generated User.rollNumber.
    const studentDocs = await Student.find({
      userId: { $in: students.map((s) => s._id) },
    })
      .select("userId rollNo")
      .lean();
    const rollNoByUserId = new Map(
      studentDocs.map((s) => [s.userId.toString(), s.rollNo])
    );

    const result = students.map((student) => {
      const id = toIdString(student._id);
      return {
        _id: id,
        name: student.name,
        rollNo: rollNoByUserId.get(id) ?? "",
        email: student.email,
        branch: student.branch,
        year: student.year,
        section: student.section,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Students GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { password, name, branch, semester, section } = body;

    if (!password || !name || !branch || semester == null || !section) {
      return NextResponse.json(
        { error: "Missing required fields: password, name, branch, semester, section" },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    await connectDB();

    const year = Math.ceil(Number(semester) / 2);
    const sectionLabel = /^\d+$/.test(String(section)) ? `Section ${section}` : section;
    const rollNumber = await generateRollNumber(branch, year);
    // rollNo (and the email derived from it) is always generated, never entered manually —
    // students log in with this roll number, so it must match what's stored here exactly.
    const rollNo = formatRollNo(branch, year, rollNumber);
    const email = rollNoToEmail(rollNo);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "A student with this roll number already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      rollNumber,
      branch,
      year,
      section: sectionLabel,
      password: hashedPassword,
      role: "student",
    });

    const student = await Student.create({
      userId: user._id,
      name,
      rollNo,
      branch,
      semester: Number(semester),
      section: sectionLabel,
    });

    await logAudit(
      payload,
      "create",
      "Student",
      `Created student ${student.name} (${student.branch} sem ${student.semester}, roll ${student.rollNo})`,
      student._id.toString()
    );

    return NextResponse.json({
      _id: student._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      name: student.name,
      rollNo: student.rollNo,
      branch: student.branch,
      semester: student.semester,
      section: student.section,
    });
  } catch (error) {
    console.error("Students POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
