import mongoose, { Schema, model, models } from "mongoose";

export interface IConversationParticipant {
  userId: mongoose.Types.ObjectId;
  name: string;
  role: "admin" | "teacher";
  lastReadAt: Date;
}

export interface IConversation {
  _id: mongoose.Types.ObjectId;
  kind: "dm" | "group";
  participants: mongoose.Types.DocumentArray<IConversationParticipant>;
  participantKey?: string;
  isStaffGroup?: boolean;
  name?: string;
  lastMessageAt: Date;
  lastMessagePreview?: string;
  lastMessageSenderName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IConversationParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "teacher"], required: true },
    lastReadAt: { type: Date, default: () => new Date(0) },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    kind: { type: String, enum: ["dm", "group"], required: true },
    participants: { type: [ParticipantSchema], default: [] },
    // DM-only: [id1,id2].sort().join("_"). Lets find-or-create dedupe threads so two
    // people never end up with duplicate DM conversations.
    participantKey: { type: String },
    // Group-only, always true when present: the unique partial index below enforces
    // at most one group conversation ever existing.
    isStaffGroup: { type: Boolean },
    name: { type: String, trim: true, maxlength: 60 },
    lastMessageAt: { type: Date, required: true, default: Date.now },
    lastMessagePreview: { type: String, maxlength: 160 },
    lastMessageSenderName: { type: String },
  },
  { timestamps: true }
);

ConversationSchema.index({ "participants.userId": 1, lastMessageAt: -1 });
ConversationSchema.index({ participantKey: 1 }, { unique: true, sparse: true });
ConversationSchema.index({ isStaffGroup: 1 }, { unique: true, partialFilterExpression: { isStaffGroup: true } });

export default models.Conversation ?? model<IConversation>("Conversation", ConversationSchema);
