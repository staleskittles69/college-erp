import mongoose from "mongoose";
import Student from "@/models/Student";
import { escapeRegex } from "@/lib/utils";

// The full roll number students log in with (e.g. "25CSE00001") lives on the Student document;
// User.rollNumber is only the serial number within the section. Callers must have run connectDB().

// userId -> full roll number
export async function rollNumbersFor(userIds: (string | mongoose.Types.ObjectId)[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const students = await Student.find({ userId: { $in: userIds } })
    .select("userId rollNo")
    .lean<{ userId: mongoose.Types.ObjectId; rollNo: string }[]>();
  return new Map(students.map((student) => [student.userId.toString(), student.rollNo]));
}

// User ids of students whose roll number or name contains `search` (case-insensitive).
export async function studentUserIdsMatching(search: string, limit = 500): Promise<mongoose.Types.ObjectId[]> {
  const pattern = { $regex: escapeRegex(search), $options: "i" };
  const students = await Student.find({ $or: [{ rollNo: pattern }, { name: pattern }] })
    .select("userId")
    .limit(limit)
    .lean<{ userId: mongoose.Types.ObjectId }[]>();
  return students.map((student) => student.userId);
}
