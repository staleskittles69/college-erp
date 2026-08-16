import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Resource from "@/models/Resource";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import { toIdString } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let filter: Record<string, unknown> = {};
    if (payload.role === "student") {
      const User = (await import("@/models/User")).default;
      const user = await User.findById(payload.userId).lean() as { branch?: string; year?: number } | null;
      if (!user?.branch || !user?.year) return NextResponse.json([]);
      filter = { branch: user.branch, year: user.year };
    } else if (payload.role === "teacher") {
      filter = { uploadedBy: payload.userId };
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      resources.map((resource) => ({
        _id: toIdString(resource._id),
        title: resource.title,
        subject: resource.subject,
        branch: resource.branch,
        year: resource.year,
        fileUrl: resource.fileUrl,
        fileName: resource.fileName,
        createdAt: resource.createdAt,
      }))
    );
  } catch (error) {
    console.error("Resources GET error:", error);
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
    if (payload.role !== "teacher" && !requireAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, subject, branch, year, fileUrl, fileName } = body;

    if (!title || !subject || !branch || year == null || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: title, subject, branch, year, fileUrl, fileName" },
        { status: 400 }
      );
    }

    await connectDB();

    const resource = await Resource.create({
      title,
      subject,
      branch,
      year: Number(year),
      fileUrl,
      fileName,
      uploadedBy: payload.userId,
    });

    return NextResponse.json({
      _id: resource._id.toString(),
      title: resource.title,
      subject: resource.subject,
      branch: resource.branch,
      year: resource.year,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
      createdAt: resource.createdAt,
    });
  } catch (error) {
    console.error("Resources POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
