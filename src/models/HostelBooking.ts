import mongoose, { Schema, model, models } from "mongoose";

export interface IHostelBooking {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // the student's User account
  roomId: mongoose.Types.ObjectId;
  gender: "boys" | "girls";
  sharing: 2 | 3;
  ac: boolean;
  fee: number; // price for this room type at the time of booking
  createdAt: Date;
  updatedAt: Date;
}

const HostelBookingSchema = new Schema<IHostelBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    roomId: { type: Schema.Types.ObjectId, ref: "HostelRoom", required: true },
    gender: { type: String, enum: ["boys", "girls"], required: true },
    sharing: { type: Number, enum: [2, 3], required: true },
    ac: { type: Boolean, required: true },
    fee: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

HostelBookingSchema.index({ roomId: 1 });

export default models.HostelBooking ?? model<IHostelBooking>("HostelBooking", HostelBookingSchema);
