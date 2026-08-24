import mongoose, { Schema, model, models } from "mongoose";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  recipientUserId: mongoose.Types.ObjectId;
  type: "forum_mention";
  actorUserId: mongoose.Types.ObjectId;
  actorName: string;
  forumId: mongoose.Types.ObjectId;
  forumName: string;
  messageId: mongoose.Types.ObjectId;
  messagePreview: string;
  read: boolean;
  createdAt: Date;
}

const NOTIFICATION_RETENTION_SECONDS = 90 * 24 * 60 * 60; // 3 months

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["forum_mention"], required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    forumId: { type: Schema.Types.ObjectId, ref: "Forum", required: true },
    forumName: { type: String, required: true },
    messageId: { type: Schema.Types.ObjectId, ref: "ForumMessage", required: true },
    messagePreview: { type: String, required: true, maxlength: 160 },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ recipientUserId: 1, read: 1, createdAt: -1 });
// MongoDB auto-deletes documents once createdAt is older than the retention window.
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: NOTIFICATION_RETENTION_SECONDS });

export default models.Notification ?? model<INotification>("Notification", NotificationSchema);
