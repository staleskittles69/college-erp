import mongoose, { Schema, model, models } from "mongoose";

export interface IDepartment {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  label: string;
  color: string;
}

const DepartmentSchema = new Schema<IDepartment>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, required: true },
});

export default models.Department ?? model<IDepartment>("Department", DepartmentSchema);
