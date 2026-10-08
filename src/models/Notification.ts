import mongoose, { Schema, model, models } from "mongoose";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  recipientUserId: mongoose.Types.ObjectId;
  type: "forum_mention" | "new_message" | "query_received" | "notice_posted" | "leave_decision" | "substitute_assigned";
  actorUserId: mongoose.Types.ObjectId;
  actorName: string;
  forumId?: mongoose.Types.ObjectId;
  forumName?: string;
  conversationId?: mongoose.Types.ObjectId;
  conversationName?: string;
  messageId?: mongoose.Types.ObjectId;
  messagePreview: string;
  // Set for the general (non-chat) types: a headline plus the portal path the bell opens on click.
  title?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NOTIFICATION_RETENTION_SECONDS = 90 * 24 * 60 * 60; // 3 months

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["forum_mention", "new_message", "query_received", "notice_posted", "leave_decision", "substitute_assigned"],
      required: true,
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    forumId: { type: Schema.Types.ObjectId, ref: "Forum" },
    forumName: { type: String },
    // Set for "new_message" notifications; conversationName only for the staff group thread
    // (its presence/absence is how the UI tells a group post apart from a 1:1 DM).
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    conversationName: { type: String },
    messageId: { type: Schema.Types.ObjectId },
    messagePreview: { type: String, required: true, maxlength: 160 },
    title: { type: String, maxlength: 120 },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ recipientUserId: 1, read: 1, createdAt: -1 });
// MongoDB auto-deletes documents once createdAt is older than the retention window.
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: NOTIFICATION_RETENTION_SECONDS });

export default models.Notification ?? model<INotification>("Notification", NotificationSchema);
