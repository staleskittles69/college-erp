import mongoose, { Schema, model, models } from "mongoose";

// A single document holding hostel prices and the yearly due dates. Read it with getFeeSettings().
export interface IFeeSettings {
  _id: mongoose.Types.ObjectId;
  hostelFees: { twoAc: number; twoNonAc: number; threeAc: number; threeNonAc: number };
  hostelDueDate?: Date | null;
  transportDueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSettingsSchema = new Schema<IFeeSettings>(
  {
    hostelFees: {
      twoAc: { type: Number, default: 0, min: 0 },
      twoNonAc: { type: Number, default: 0, min: 0 },
      threeAc: { type: Number, default: 0, min: 0 },
      threeNonAc: { type: Number, default: 0, min: 0 },
    },
    hostelDueDate: { type: Date, default: null },
    transportDueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default models.FeeSettings ?? model<IFeeSettings>("FeeSettings", FeeSettingsSchema);
