import mongoose, { Schema, model, models } from "mongoose";

export interface IForumMessage {
  _id: mongoose.Types.ObjectId;
  forumId: mongoose.Types.ObjectId;
  senderUserId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: "student" | "teacher";
  text: string;
  mentions: { userId: mongoose.Types.ObjectId; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const ForumMessageSchema = new Schema<IForumMessage>(
  {
    forumId: { type: Schema.Types.ObjectId, ref: "Forum", required: true },
    senderUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["student", "teacher"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    mentions: {
      type: [{ userId: { type: Schema.Types.ObjectId, ref: "User" }, name: String }],
      default: [],
    },
  },
  { timestamps: true }
);

ForumMessageSchema.index({ forumId: 1, createdAt: 1 });

export default models.ForumMessage ?? model<IForumMessage>("ForumMessage", ForumMessageSchema);
