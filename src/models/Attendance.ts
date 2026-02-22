import mongoose, { Schema, model, models } from "mongoose";

export interface IAttendance {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject: string;
  date: Date;
  status: "present" | "absent";
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent"], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ date: 1, subject: 1 });

export default models.Attendance ?? model<IAttendance>("Attendance", AttendanceSchema);
