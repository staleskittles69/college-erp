import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subject from "@/models/Subject";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import mongoose from "mongoose";

type PopulatedTeacher = { _id: mongoose.Types.ObjectId; name: string };

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    if (!department) {
      return NextResponse.json({ error: "department is required" }, { status: 400 });
    }

    await connectDB();

    const subjects = await Subject.find({ department })
      .populate("teacherIds", "name")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(
      subjects.map((subject) => ({
        id: (subject._id as mongoose.Types.ObjectId).toString(),
        name: subject.name,
        department: subject.department,
        teacherCount: (subject.teacherIds as unknown as PopulatedTeacher[]).length,
      }))
    );
  } catch (error) {
    console.error("Subjects GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, department } = body;
    if (!name || !department) {
      return NextResponse.json({ error: "name and department are required" }, { status: 400 });
    }

    await connectDB();

    const existing = await Subject.findOne({ department, name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: "This subject already exists in the department" }, { status: 400 });
    }

    const subject = await Subject.create({ name: name.trim(), department, teacherIds: [] });

    await logAudit(payload, "create", "Subject", `Created subject "${subject.name}" in ${department}`, subject._id.toString());

    return NextResponse.json({
      id: subject._id.toString(),
      name: subject.name,
      department: subject.department,
      teacherCount: 0,
    });
  } catch (error) {
    console.error("Subjects POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
