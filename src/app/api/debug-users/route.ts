import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const users = await User.find({}).select("name email role rollNumber password").lean();
  return NextResponse.json(users);
}
