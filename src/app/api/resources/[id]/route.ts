import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import path from "path";
import { unlink } from "fs/promises";
import connectDB from "@/lib/db";
import Resource from "@/models/Resource";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { isOwnUploadUrl } from "@/lib/uploads";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const isOwner = resource.uploadedBy.toString() === payload.userId;
    if (!isOwner && !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only delete the stored file if it belongs to whoever added the resource; older resources
    // saved before uploads were filed per user just lose the database entry.
    const uploaderId = resource.uploadedBy.toString();
    if (process.env.DEMO_OFFLINE === "1" && resource.fileUrl.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", "uploads", path.basename(resource.fileUrl))).catch(() => {});
    } else if (isOwnUploadUrl(resource.fileUrl, uploaderId)) {
      await del(resource.fileUrl).catch(() => {});
    }
    await resource.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resource DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
