import mongoose, { Schema, model, models } from "mongoose";

export interface IResource {
  _id: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  branch: string;
  year: number;
  fileUrl: string;
  fileName: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    branch: { type: String, required: true },
    year: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ResourceSchema.index({ branch: 1, year: 1, createdAt: -1 });

export default models.Resource ?? model<IResource>("Resource", ResourceSchema);
