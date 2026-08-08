import mongoose, { Schema, model, models } from "mongoose";

export interface ISubject {
  _id: mongoose.Types.ObjectId;
  name: string;
  department: string; // Department.slug
  teacherIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    department: { type: String, required: true },
    teacherIds: { type: [Schema.Types.ObjectId], ref: "Teacher", default: [] },
  },
  { timestamps: true }
);

SubjectSchema.index({ department: 1, name: 1 }, { unique: true });

export default models.Subject ?? model<ISubject>("Subject", SubjectSchema);
