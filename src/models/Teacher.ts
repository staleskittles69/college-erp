import mongoose, { Schema, model, models } from "mongoose";

export interface ITeacher {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  employeeId: string;
  department: string;
  subjects: string[];
  teaching: { branch: string; year: number; sections: string[] }[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    employeeId: { type: String, required: true },
    department: { type: String, required: true },
    subjects: { type: [String], default: [] },
    teaching: {
      type: [{ branch: String, year: Number, sections: [String] }],
      default: [],
    },
  },
  { timestamps: true }
);

TeacherSchema.index({ userId: 1 }, { unique: true });
TeacherSchema.index({ employeeId: 1 }, { unique: true });
TeacherSchema.index({ department: 1 });

export default models.Teacher ?? model<ITeacher>("Teacher", TeacherSchema);
