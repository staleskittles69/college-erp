import mongoose, { Schema, model, models } from "mongoose";

export interface IQuery {
  _id: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  fromName: string;
  fromRole: "student" | "teacher";
  toRole: "admin" | "teacher";
  toUserId?: mongoose.Types.ObjectId;
  toName: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const QuerySchema = new Schema<IQuery>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromName: { type: String, required: true },
    fromRole: { type: String, enum: ["student", "teacher"], required: true },
    toRole: { type: String, enum: ["admin", "teacher"], default: "admin" },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    toName: { type: String, default: "Admin" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

QuerySchema.index({ status: 1, createdAt: -1 });
QuerySchema.index({ fromUserId: 1, createdAt: -1 });
QuerySchema.index({ toRole: 1, toUserId: 1, createdAt: -1 });

export default models.Query ?? model<IQuery>("Query", QuerySchema);
