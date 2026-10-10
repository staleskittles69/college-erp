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
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    // sparse: true allows multiple docs with no email
    // Stored lowercased: login lowercases what's typed before looking it up.
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    rollNumber: { type: Number },
    branch: { type: String },
    year: { type: Number },
    section: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "student", "teacher"], required: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// rollNumber is the student's serial number within their section (each section starts at 1).
// The academic roll number students log in with is Student.rollNo. Only students are checked,
// so staff accounts never clash on this index.
UserSchema.index(
  { branch: 1, year: 1, section: 1, rollNumber: 1 },
  { unique: true, partialFilterExpression: { role: "student" } }
);

UserSchema.pre("save", function (next) {
  if (this.role === "student" && !this.rollNumber) {
    return next(new Error("Students must have a rollNumber"));
  }
  next();
});

export default models.User ?? model<IUser>("User", UserSchema);
