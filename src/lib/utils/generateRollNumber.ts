import User from "@/models/User";

/**
 * Returns the next available roll number by finding the highest existing one
 * and adding 1. Thread-safe enough for low-concurrency use.
 */
export async function generateRollNumber(): Promise<number> {
  const lastStudent = await User.findOne({ role: "student" })
    .sort({ rollNumber: -1 })
    .select("rollNumber")
    .lean();

  return ((lastStudent as { rollNumber?: number } | null)?.rollNumber ?? 0) + 1;
}
