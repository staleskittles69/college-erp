import mongoose, { Schema, model, models } from "mongoose";

export interface IStudent {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  rollNo: string;
  branch: string;
  semester: number;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
  },
  { timestamps: true }
);

StudentSchema.index({ userId: 1 }, { unique: true });
StudentSchema.index({ rollNo: 1, branch: 1, semester: 1 });

export default models.Student ?? model<IStudent>("Student", StudentSchema);
