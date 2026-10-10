import User from "@/models/User";
import Student from "@/models/Student";
import { rollNoPrefix } from "@/lib/utils/rollNumber";

/**
 * Next serial number (User.rollNumber) within one section: the highest one there plus 1.
 * Each section starts at 1. Thread-safe enough for low-concurrency use — a clash is caught by
 * the unique index on branch+year+section+rollNumber.
 */
export async function nextSectionSerial(branch: string, year: number, section: string): Promise<number> {
  const lastStudent = await User.findOne({ role: "student", branch, year, section })
    .sort({ rollNumber: -1 })
    .select("rollNumber")
    .lean<{ rollNumber?: number } | null>();

  return (lastStudent?.rollNumber ?? 0) + 1;
}

/**
 * Next sequence for the academic roll number (the last 5 digits of Student.rollNo). Unlike the
 * section serial, this keeps counting across the whole branch+year, e.g. 25CSE00600 -> 25CSE00601.
 */
export async function nextRollNoSequence(branch: string, year: number): Promise<number> {
  const prefix = rollNoPrefix(branch, year);
  // Fixed width ({prefix}{5 digits}), so sorting the text descending gives the highest number.
  const last = await Student.findOne({ rollNo: { $regex: new RegExp(`^${prefix}[0-9]{5}$`) } })
    .sort({ rollNo: -1 })
    .select("rollNo")
    .lean<{ rollNo: string } | null>();

  return (last ? Number(last.rollNo.slice(prefix.length)) : 0) + 1;
}
