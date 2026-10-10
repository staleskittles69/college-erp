import mongoose, { Schema, model, models } from "mongoose";

export interface IFeeDue {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // the student's User account
  type: "hostel" | "transport";
  description: string;
  amount: number;
  status: "pending" | "paid";
  paidAt?: Date;
  markedBy?: mongoose.Types.ObjectId; // admin who ticked it paid
  createdAt: Date;
  updatedAt: Date;
}

const FeeDueSchema = new Schema<IFeeDue>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["hostel", "transport"], required: true },
    description: { type: String, required: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    paidAt: { type: Date },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

FeeDueSchema.index({ userId: 1, type: 1, status: 1 });
FeeDueSchema.index({ status: 1, createdAt: -1 });

export default models.FeeDue ?? model<IFeeDue>("FeeDue", FeeDueSchema);
