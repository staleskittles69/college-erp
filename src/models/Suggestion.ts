import mongoose, { Schema, model, models } from "mongoose";

export interface ISuggestion {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  role: "student" | "teacher" | "admin";
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher", "admin"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

SuggestionSchema.index({ createdAt: -1 });
SuggestionSchema.index({ userId: 1, createdAt: -1 });

export default models.Suggestion ?? model<ISuggestion>("Suggestion", SuggestionSchema);
