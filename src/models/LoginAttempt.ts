import { Schema, model, models } from "mongoose";

// Failed-login counters for rate limiting. Stored in MongoDB because Vercel runs many
// short-lived server instances that don't share memory. See lib/rateLimit.ts.
export interface ILoginAttempt {
  key: string;
  count: number;
  expiresAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
});

LoginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.LoginAttempt ?? model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);
