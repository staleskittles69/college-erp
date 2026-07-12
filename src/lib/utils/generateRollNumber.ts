import User from "@/models/User";

/**
 * Returns the next available roll number within a branch+year batch by
 * finding the highest existing one there and adding 1. Roll numbers restart
 * at 1 for every branch+year combination. Thread-safe enough for low-concurrency use.
 */
export async function generateRollNumber(branch: string, year: number): Promise<number> {
  const lastStudent = await User.findOne({ role: "student", branch, year })
    .sort({ rollNumber: -1 })
    .select("rollNumber")
    .lean();

  return ((lastStudent as { rollNumber?: number } | null)?.rollNumber ?? 0) + 1;
}
