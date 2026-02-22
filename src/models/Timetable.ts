import mongoose, { Schema, model, models } from "mongoose";

export interface ITimetableSlot {
  subject: string;
  time: string;
  room: string;
}

export interface ITimetable {
  _id: mongoose.Types.ObjectId;
  branch: string;
  semester: number;
  section: string;
  dayOfWeek: number;
  slots: ITimetableSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    subject: { type: String, required: true },
    time: { type: String, required: true },
    room: { type: String, required: true },
  },
  { _id: false }
);

const TimetableSchema = new Schema<ITimetable>(
  {
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    slots: [TimetableSlotSchema],
  },
  { timestamps: true }
);

TimetableSchema.index(
  { branch: 1, semester: 1, section: 1, dayOfWeek: 1 },
  { unique: true }
);

export default models.Timetable ?? model<ITimetable>("Timetable", TimetableSchema);
