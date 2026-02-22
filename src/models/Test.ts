import mongoose, { Schema, model, models } from "mongoose";

export interface ITest {
  _id: mongoose.Types.ObjectId;
  subject: string;
  title: string;
  date: Date;
  branch?: string;
  semester?: number;
  maxMarks?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    subject: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    branch: { type: String, default: null },
    semester: { type: Number, default: null },
    maxMarks: { type: Number, default: null },
  },
  { timestamps: true }
);

TestSchema.index({ date: 1 });
TestSchema.index({ branch: 1, semester: 1 });

export default models.Test ?? model<ITest>("Test", TestSchema);
