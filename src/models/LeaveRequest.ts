import mongoose, { Schema, model, models } from "mongoose";

export interface ILeaveRequest {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId; // Teacher document
  userId: mongoose.Types.ObjectId; // the teacher's User account
  teacherName: string;
  department: string;
  fromDate: Date; // UTC midnight of the first day off
  toDate: Date; // UTC midnight of the last day off (inclusive)
  reason: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: mongoose.Types.ObjectId;
  decidedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherName: { type: String, required: true },
    department: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
    adminNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ teacherId: 1, fromDate: 1 });
LeaveRequestSchema.index({ status: 1, createdAt: -1 });

export default models.LeaveRequest ?? model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);
