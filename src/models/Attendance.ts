import mongoose, { Schema, model, models } from "mongoose";

export interface IAttendance {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject: string;
  date: Date;
  // Which period of the day (1–6). Records saved before periods were tracked don't have one.
  period?: number;
  status: "present" | "absent";
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    // The student's User id (not the Student document id) — every attendance screen saves and reads it this way.
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    period: { type: Number, min: 1, max: 6 },
    status: { type: String, enum: ["present", "absent"], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// One record per student per period, so a subject taught twice in a day (e.g. a two-period lab)
// keeps both. Databases created before periods existed need scripts/migrate-attendance-period.ts
// to drop the old student+date+subject unique index.
AttendanceSchema.index({ studentId: 1, date: 1, subject: 1, period: 1 }, { unique: true });
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ date: 1, subject: 1 });

export default models.Attendance ?? model<IAttendance>("Attendance", AttendanceSchema);
