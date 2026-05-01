import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Department from "@/models/Department";
import { getAuth, requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const departments = await Department.find().sort({ name: 1 }).lean();
    return NextResponse.json(
      departments.map((d) => ({
        slug: d.slug,
        name: d.name,
        label: d.label,
        color: d.color,
      }))
    );
  } catch (err) {
    console.error("Departments GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { slug, name, label, color } = body;
    if (!slug || !name || !label || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const existing = await Department.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "Department slug already exists" }, { status: 400 });
    }

    const dept = await Department.create({ slug, name, label, color });
    return NextResponse.json({ slug: dept.slug, name: dept.name, label: dept.label, color: dept.color });
  } catch (err) {
    console.error("Departments POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
