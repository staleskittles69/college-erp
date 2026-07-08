import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Department from "@/models/Department";
import { getAuth, requireAdmin } from "@/lib/api-auth";

const DEFAULT_DEPARTMENTS = [
  { slug: "cse",  name: "CSE",  label: "Computer Science & Engineering",      color: "border-indigo-200 hover:border-indigo-400" },
  { slug: "ece",  name: "ECE",  label: "Electronics & Communication",          color: "border-blue-200 hover:border-blue-400"    },
  { slug: "me",   name: "ME",   label: "Mechanical Engineering",               color: "border-orange-200 hover:border-orange-400"},
  { slug: "ce",   name: "CE",   label: "Civil Engineering",                    color: "border-green-200 hover:border-green-400"  },
  { slug: "eee",  name: "EEE",  label: "Electrical & Electronics Engineering", color: "border-rose-200 hover:border-rose-400"    },
];

export async function POST(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const upsertOps = DEFAULT_DEPARTMENTS.map((department) => ({
    updateOne: {
      filter: { slug: department.slug },
      update: { $setOnInsert: department },
      upsert: true,
    },
  }));

  const result = await Department.bulkWrite(upsertOps);
  return NextResponse.json({ added: result.upsertedCount });
}
