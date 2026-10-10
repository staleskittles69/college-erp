import mongoose, { Schema, model, models } from "mongoose";

export interface IHostelRoom {
  _id: mongoose.Types.ObjectId;
  block: string;
  roomNumber: string;
  gender: "boys" | "girls";
  sharing: 2 | 3; // beds in the room
  ac: boolean;
  occupiedBeds: number; // kept in step with HostelBooking by the booking API
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HostelRoomSchema = new Schema<IHostelRoom>(
  {
    block: { type: String, required: true, maxlength: 20 },
    roomNumber: { type: String, required: true, maxlength: 10 },
    gender: { type: String, enum: ["boys", "girls"], required: true },
    sharing: { type: Number, enum: [2, 3], required: true },
    ac: { type: Boolean, required: true },
    occupiedBeds: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HostelRoomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });
HostelRoomSchema.index({ gender: 1, sharing: 1, ac: 1, active: 1 });

export default models.HostelRoom ?? model<IHostelRoom>("HostelRoom", HostelRoomSchema);
