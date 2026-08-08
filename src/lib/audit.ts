import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { JwtPayload } from "@/lib/auth";

// Callers must have already run connectDB() before calling this.
export async function logAudit(
  payload: JwtPayload,
  action: "create" | "update" | "delete",
  entityType: string,
  description: string,
  entityId?: string
): Promise<void> {
  if (payload.role !== "admin" && payload.role !== "teacher") return;

  try {
    const actor = await User.findById(payload.userId).select("name").lean<{ name?: string }>();
    await AuditLog.create({
      actorId: payload.userId,
      actorName: actor?.name ?? "Unknown",
      actorRole: payload.role,
      action,
      entityType,
      entityId,
      description,
    });
  } catch (error) {
    // Audit logging must never break the underlying request.
    console.error("Audit log write failed:", error);
  }
}
