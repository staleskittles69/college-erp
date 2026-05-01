import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const payload = await getAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
