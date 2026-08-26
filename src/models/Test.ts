import mongoose, { Schema, model, models } from "mongoose";

export interface ITest {
  _id: mongoose.Types.ObjectId;
  subject: string;
  title: string;
  date: Date;
  branch?: string;
  semester?: number;
  section?: string;
  testType?: string;
  maxMarks?: number;
  dueTime?: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  // Links tests scheduled together in one batch (e.g. 4 consecutive mid-exams) so the
  // whole batch can be identified and deleted together later.
  seriesId?: mongoose.Types.ObjectId;
  seriesLabel?: string;
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
    section: { type: String, default: null },
    testType: { type: String, default: null },
    maxMarks: { type: Number, default: null },
    dueTime: { type: String, default: null },
    notes: { type: String, default: null },
    attachmentUrl: { type: String, default: null },
    attachmentName: { type: String, default: null },
    seriesId: { type: Schema.Types.ObjectId, default: null },
    seriesLabel: { type: String, default: null },
  },
  { timestamps: true }
);

TestSchema.index({ date: 1 });
TestSchema.index({ branch: 1, semester: 1 });
TestSchema.index({ seriesId: 1 });

export default models.Test ?? model<ITest>("Test", TestSchema);
