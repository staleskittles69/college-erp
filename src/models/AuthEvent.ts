import mongoose, { Schema, model, models } from "mongoose";

// Login activity (sign-ins, failed attempts, password changes…). Kept separate from
// AuditLog so thousands of student logins don't bury the record of data changes.
export const AUTH_EVENT_TYPES = [
  "login",
  "login_failed",
  "login_blocked",
  "logout",
  "password_changed",
  "password_reset_by_admin",
  "sessions_revoked",
] as const;

export type AuthEventType = (typeof AUTH_EVENT_TYPES)[number];

export interface IAuthEvent {
  _id: mongoose.Types.ObjectId;
  type: AuthEventType;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  role?: "admin" | "student" | "teacher";
  // What was typed in the login box — kept for failed attempts on unknown accounts.
  identifier?: string;
  ip?: string;
  userAgent?: string;
  detail?: string;
  createdAt: Date;
}

const AUTH_EVENT_RETENTION_SECONDS = 90 * 24 * 60 * 60; // 3 months, same as AuditLog

const AuthEventSchema = new Schema<IAuthEvent>(
  {
    type: { type: String, enum: AUTH_EVENT_TYPES, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    role: { type: String, enum: ["admin", "student", "teacher"] },
    identifier: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    detail: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuthEventSchema.index({ createdAt: -1 });
AuthEventSchema.index({ type: 1, createdAt: -1 });
AuthEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: AUTH_EVENT_RETENTION_SECONDS });

export default models.AuthEvent ?? model<IAuthEvent>("AuthEvent", AuthEventSchema);
