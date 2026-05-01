import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Department from "@/models/Department";
import { getAuth, requireAdmin } from "@/lib/api-auth";

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin(payload)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const result = await Department.deleteOne({ slug: params.slug });
  if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ deleted: true });
}
