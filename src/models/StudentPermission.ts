import mongoose, { Schema, model, models } from "mongoose";

// One mid-day campus exit an admin allowed. createdAt is the time it was granted.
export interface IStudentPermission {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // the student's User account
  // Copied at the time of logging, so the history still reads correctly if the student is renamed.
  rollNo: string;
  studentName: string;
  reason: string;
  grantedBy: mongoose.Types.ObjectId;
  grantedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PERMISSION_REASON_MAX_LENGTH = 200;

const StudentPermissionSchema = new Schema<IStudentPermission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rollNo: { type: String, required: true },
    studentName: { type: String, required: true },
    reason: { type: String, default: "", trim: true, maxlength: PERMISSION_REASON_MAX_LENGTH },
    grantedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    grantedByName: { type: String, required: true },
  },
  { timestamps: true }
);

StudentPermissionSchema.index({ userId: 1, createdAt: -1 });
StudentPermissionSchema.index({ createdAt: -1 });

export default models.StudentPermission ?? model<IStudentPermission>("StudentPermission", StudentPermissionSchema);
