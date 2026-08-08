import mongoose, { Schema, model, models } from "mongoose";

export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: "admin" | "teacher";
  action: "create" | "update" | "delete";
  entityType: string;
  entityId?: string;
  description: string;
  createdAt: Date;
}

const AUDIT_LOG_RETENTION_SECONDS = 90 * 24 * 60 * 60; // 3 months

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: ["admin", "teacher"], required: true },
    action: { type: String, enum: ["create", "update", "delete"], required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });
// MongoDB auto-deletes documents once createdAt is older than the retention window.
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: AUDIT_LOG_RETENTION_SECONDS });

export default models.AuditLog ?? model<IAuditLog>("AuditLog", AuditLogSchema);
