import mongoose, { Schema, model, models } from "mongoose";
import { FORUM_CATEGORIES } from "@/lib/forumCategories";

export interface IForum {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: string;
  createdByUserId: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ForumSchema = new Schema<IForum>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, enum: FORUM_CATEGORIES, default: "General" },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

ForumSchema.index({ category: 1, createdAt: -1 });

export default models.Forum ?? model<IForum>("Forum", ForumSchema);
