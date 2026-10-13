import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Resource from "@/models/Resource";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { deleteUploadIfUnused } from "@/lib/uploadCleanup";

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

    await resource.deleteOne();
    await deleteUploadIfUnused(resource.fileUrl, resource.uploadedBy.toString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resource DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
