import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Suggestion from "@/models/Suggestion";
import { getAuth, isSuggestionsOwner } from "@/lib/api-auth";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = await getAuth(request);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    if (!(await isSuggestionsOwner(payload))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await Suggestion.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Suggestions DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
