import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  rollNumber?: number;
  branch?: string;
  year?: number;
  section?: string;
  password: string;
  role: "admin" | "student" | "teacher";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    // sparse: true allows multiple docs with no email/rollNumber
    email: { type: String, unique: true, sparse: true },
    rollNumber: { type: Number, unique: true, sparse: true },
    branch: { type: String },
    year: { type: Number },
    section: { type: String },
    // TODO: hash passwords before going to production
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "student", "teacher"], required: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (this.role === "student" && !this.rollNumber) {
    return next(new Error("Students must have a rollNumber"));
  }
  next();
});

export default models.User ?? model<IUser>("User", UserSchema);
