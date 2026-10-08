import mongoose, { Schema, model, models } from "mongoose";

// One class covered by another teacher while the usual teacher is on approved leave.
// Timetable slots don't record a teacher, so covers are kept here instead.
export interface ISubstitution {
  _id: mongoose.Types.ObjectId;
  leaveRequestId: mongoose.Types.ObjectId;
  date: Date; // UTC midnight of the day being covered
  period: number;
  time: string;
  room: string;
  subject: string;
  branch: string;
  semester: number; // class year, same meaning as Timetable.semester
  section: string;
  originalTeacherId: mongoose.Types.ObjectId; // Teacher document
  substituteTeacherId: mongoose.Types.ObjectId; // Teacher document
  createdAt: Date;
  updatedAt: Date;
}

const SubstitutionSchema = new Schema<ISubstitution>(
  {
    leaveRequestId: { type: Schema.Types.ObjectId, ref: "LeaveRequest", required: true },
    date: { type: Date, required: true },
    period: { type: Number, required: true, min: 1, max: 6 },
    time: { type: String, default: "" },
    room: { type: String, default: "" },
    subject: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    originalTeacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    substituteTeacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  },
  { timestamps: true }
);

SubstitutionSchema.index({ leaveRequestId: 1, date: 1, period: 1 }, { unique: true });
SubstitutionSchema.index({ substituteTeacherId: 1, date: 1 });
SubstitutionSchema.index({ originalTeacherId: 1, date: 1 });

export default models.Substitution ?? model<ISubstitution>("Substitution", SubstitutionSchema);
