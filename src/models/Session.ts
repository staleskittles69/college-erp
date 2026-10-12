import mongoose, { Schema, model, models } from "mongoose";

// One document per login. Deleting it logs that device out immediately, even though
// the browser still holds a signed cookie (getAuth checks this collection on every API call).
export interface ISession {
  _id: string;
  userId: mongoose.Types.ObjectId;
  role: "admin" | "student" | "teacher";
  expiresAt: Date;
  lastSeenAt: Date;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    _id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["admin", "student", "teacher"], required: true },
    expiresAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB deletes each session once its expiresAt has passed.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.Session ?? model<ISession>("Session", SessionSchema);
