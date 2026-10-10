import mongoose, { Schema, model, models } from "mongoose";

export interface ITransportBooking {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // the student's User account
  routeId: mongoose.Types.ObjectId;
  stopName: string;
  fee: number; // route's annual fee at the time of booking
  createdAt: Date;
  updatedAt: Date;
}

const TransportBookingSchema = new Schema<ITransportBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    routeId: { type: Schema.Types.ObjectId, ref: "BusRoute", required: true },
    stopName: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

TransportBookingSchema.index({ routeId: 1 });

export default models.TransportBooking ?? model<ITransportBooking>("TransportBooking", TransportBookingSchema);
