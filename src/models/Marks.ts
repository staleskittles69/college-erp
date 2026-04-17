import mongoose, { Schema, model, models } from "mongoose";

export interface IMarks {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject: string;
  examType: string;
  obtained: number;
  max: number;
  createdAt: Date;
  updatedAt: Date;
}

const MarksSchema = new Schema<IMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    examType: { type: String, required: true },
    obtained: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  { timestamps: true }
);

MarksSchema.index({ studentId: 1 });

export default models.Marks ?? model<IMarks>("Marks", MarksSchema);
