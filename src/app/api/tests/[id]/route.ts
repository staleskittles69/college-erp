import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Test from "@/models/Test";
import { getAuth, requireAdmin } from "@/lib/api-auth";
import mongoose from "mongoose";

/* ---------- GET TEST BY ID ---------- */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const test = await Test.findById(id).lean<{
      _id: mongoose.Types.ObjectId;
      subject: string;
      title: string;
      date: Date;
      maxMarks: number;
      createdAt?: Date;
    }>();

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: test._id.toString(),
      subject: test.subject,
      title: test.title,
      date: test.date,
      maxMarks: test.maxMarks,
      createdAt: test.createdAt,
    });
  } catch (error) {
    console.error("Test GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE TEST ---------- */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  try {
    const payload = await getAuth(request);

    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireAdmin(payload))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await connectDB();

    const deleted = await Test.findByIdAndDelete(id);

    if (!deleted)
      return NextResponse.json({ error: "Test not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}