import { JwtPayload } from "@/lib/auth";

// Admins can change anything. Teachers can change only records they created themselves.
// Records with no owner (older data) stay admin-only.
export function canModifyOwned(
  payload: JwtPayload,
  createdBy: { toString(): string } | null | undefined
): boolean {
  if (payload.role === "admin") return true;
  if (payload.role !== "teacher") return false;
  if (!createdBy) return false;
  return createdBy.toString() === payload.userId;
}
