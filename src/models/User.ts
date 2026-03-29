import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  studentId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "teacher", "admin"], required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
  },
  { timestamps: true }
);

export default models.User ?? model<IUser>("User", UserSchema);
