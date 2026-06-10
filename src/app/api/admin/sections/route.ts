import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "admin" && payload.role !== "teacher")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const branch = searchParams.get("branch");
  const year = searchParams.get("year");

  if (!branch || !year)
    return NextResponse.json({ error: "branch and year are required" }, { status: 400 });

  await connectDB();

  const sections: string[] = await User.distinct("section", {
    role: "student",
    branch,
    year: parseInt(year, 10),
    section: { $ne: null, $exists: true },
  });

  const sorted = sections.filter(Boolean).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  return NextResponse.json(sorted);
}
