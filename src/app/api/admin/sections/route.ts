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

  const match = {
    role: "student",
    branch,
    year: parseInt(year, 10),
    section: { $nin: [null, ""], $exists: true },
  };

  // ?withCounts=true → [{ section, count }] for the section cards; otherwise a plain list of names.
  const withCounts = searchParams.get("withCounts") === "true";
  const rows: { section: string; count: number }[] = withCounts
    ? (await User.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: "$section", count: { $sum: 1 } } },
      ])).map((row) => ({ section: row._id, count: row.count }))
    : ((await User.distinct("section", match)) as string[]).map((section) => ({ section, count: 0 }));

  rows.sort((rowA, rowB) => {
    const numA = parseInt(rowA.section.replace(/\D/g, ""), 10);
    const numB = parseInt(rowB.section.replace(/\D/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return rowA.section.localeCompare(rowB.section);
  });
  return NextResponse.json(withCounts ? rows : rows.map((row) => row.section));
}
