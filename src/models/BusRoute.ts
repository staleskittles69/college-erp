import mongoose, { Schema, model, models } from "mongoose";

export interface IBusStop {
  name: string;
  pickupTime: string; // "HH:MM", 24-hour
}

export interface IBusRoute {
  _id: mongoose.Types.ObjectId;
  routeNumber: string;
  name: string;
  stops: IBusStop[];
  annualFee: number;
  capacity: number;
  bookedSeats: number; // kept in step with TransportBooking by the booking API
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusStopSchema = new Schema<IBusStop>(
  {
    name: { type: String, required: true, maxlength: 80 },
    pickupTime: { type: String, required: true },
  },
  { _id: false }
);

const BusRouteSchema = new Schema<IBusRoute>(
  {
    routeNumber: { type: String, required: true, unique: true, maxlength: 20 },
    name: { type: String, required: true, maxlength: 100 },
    stops: { type: [BusStopSchema], default: [] },
    annualFee: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.BusRoute ?? model<IBusRoute>("BusRoute", BusRouteSchema);
