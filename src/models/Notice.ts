import mongoose, { Schema, model, models } from "mongoose";

export interface INotice {
  _id: mongoose.Types.ObjectId;
  title: string;
  body: string;
  createdBy: mongoose.Types.ObjectId;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NoticeSchema.index({ createdAt: -1 });

export default models.Notice ?? model<INotice>("Notice", NoticeSchema);
